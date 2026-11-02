
package com.example._justice.service;

import com.example._justice.dto.CreateOrderResponse;
import com.example._justice.dto.PaymentRequest;
import com.example._justice.dto.PayPalCaptureRequest;
import com.example._justice.entity.Case;
import com.example._justice.entity.Payment;
import com.example._justice.repository.CaseRepository;
import com.example._justice.repository.PaymentRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

        private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

        private final PaymentRepository paymentRepository;
        private final CaseRepository caseRepository;
        private final RestClient paypalClient;

        private final String clientId;
        private final String clientSecret;
        private final String currency;
        private final BigDecimal amount;

        @Value("${payment.return-url:http://localhost:5173/payment}")
        private String returnUrl;

        @Value("${payment.cancel-url:http://localhost:5173/payment?paypal=cancel}")
        private String cancelUrl;

        public PaymentService(
                        PaymentRepository paymentRepository,
                        CaseRepository caseRepository,
                        @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}") String baseUrl,
                        @Value("${paypal.client-id}") String clientId,
                        @Value("${paypal.client-secret}") String clientSecret,
                        @Value("${payment.currency:USD}") String currency,
                        @Value("${payment.amount:99.00}") String amount) {

                this.paymentRepository = paymentRepository;
                this.caseRepository = caseRepository;
                this.clientId = clientId;
                this.clientSecret = clientSecret;
                this.currency = currency.trim().toUpperCase();
                this.amount = new BigDecimal(amount);

                if (this.amount.signum() <= 0) {
                        throw new IllegalArgumentException(
                                        "payment.amount must be greater than zero");
                }

                if (!this.currency.matches("[A-Z]{3}")) {
                        throw new IllegalArgumentException(
                                        "payment.currency must be a three-letter currency code");
                }

                this.paypalClient = RestClient.builder()
                                .baseUrl(baseUrl)
                                .build();
        }

        // 1. CREATE PAYPAL ORDER

        @Transactional
        public CreateOrderResponse createPayment(PaymentRequest request) {

                Case existingCase = caseRepository
                                .findByCaseId(request.getCaseId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Case not found"));

                var existingPaymentOptional = paymentRepository.findByCaseId(existingCase.getCaseId());

                Payment payment;

                if (existingPaymentOptional.isPresent()) {
                        payment = existingPaymentOptional.get();

                        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "This case has already been paid for");
                        }

                        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Existing payment needs review. Status: "
                                                                + payment.getStatus());
                        }

                        if (!"PAYPAL".equalsIgnoreCase(payment.getProvider())) {
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Existing payment uses a different provider");
                        }

                        String existingOrderId = payment.getPaypalOrderId();

                        // Reuse an existing PayPal order when possible.
                        if (existingOrderId != null && !existingOrderId.isBlank()) {
                                Map<String, Object> existingOrder = getPayPalOrder(existingOrderId);

                                String orderStatus = String.valueOf(existingOrder.get("status"));

                                if ("CREATED".equalsIgnoreCase(orderStatus)) {
                                        validateOrderReferences(existingOrder, payment);

                                        return buildCreateOrderResponse(
                                                        payment,
                                                        existingOrderId,
                                                        getApprovalUrl(existingOrder));
                                }

                                // Do not create a second order automatically when the
                                // previous order may already be approved or completed.
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Existing PayPal order requires review. Status: "
                                                                + orderStatus);
                        }

                        // The existing pending payment has no stored order ID.
                        // Check PayPal Sandbox activity and backend logs before
                        // allowing this recovery path to create another order.
                        log.warn(
                                        "Pending PayPal payment has no order ID: paymentId={}, caseId={}",
                                        payment.getPaymentId(),
                                        payment.getCaseId());

                } else {
                        // Create a database payment only when no payment exists.
                        payment = new Payment();
                        payment.setPaymentId("AP-" + existingCase.getCaseId());
                        payment.setCaseId(existingCase.getCaseId());
                        payment.setCustomerEmail(existingCase.getCustomerEmail());
                        payment.setAmount(amount.doubleValue());
                        payment.setCurrency(currency);
                        payment.setProvider("PAYPAL");
                        payment.setStatus("PENDING");

                        paymentRepository.save(payment);
                }

                // Validate the stored values before sending an order to PayPal.
                if (payment.getAmount() == null
                                || payment.getCurrency() == null
                                || payment.getCurrency().isBlank()) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Payment amount or currency is missing");
                }

                BigDecimal paymentAmount = BigDecimal.valueOf(payment.getAmount());

                if (paymentAmount.signum() <= 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Payment amount must be greater than zero");
                }

                String paymentCurrency = payment.getCurrency().trim().toUpperCase();

                Map<String, Object> purchaseUnit = Map.of(
                                "reference_id", payment.getCaseId(),
                                "custom_id", payment.getPaymentId(),
                                "description", "APPEEL.SE case payment",
                                "amount", Map.of(
                                                "currency_code", paymentCurrency,
                                                "value", paymentAmount.toPlainString()));

                Map<String, Object> applicationContext = Map.of(
                                "return_url", returnUrl,
                                "cancel_url", cancelUrl,
                                "user_action", "PAY_NOW");

                Map<String, Object> orderRequest = Map.of(
                                "intent", "CAPTURE",
                                "purchase_units", List.of(purchaseUnit),
                                "application_context", applicationContext);

                Map<String, Object> order = paypalClient.post()
                                .uri("/v2/checkout/orders")
                                .headers(headers -> {
                                        headers.setBearerAuth(getAccessToken());
                                        headers.setContentType(MediaType.APPLICATION_JSON);
                                })
                                .body(orderRequest)
                                .retrieve()
                                .body(Map.class);

                if (order == null || order.get("id") == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "PayPal did not return an order ID");
                }

                String paypalOrderId = String.valueOf(order.get("id"));

                // Save the new order ID on the SAME payment record.
                payment.setPaypalOrderId(paypalOrderId);
                paymentRepository.saveAndFlush(payment);

                Map<String, Object> fullOrder = getPayPalOrder(paypalOrderId);

                log.info(
                                "PayPal order created: orderId={}, paymentId={}, status={}",
                                paypalOrderId,
                                payment.getPaymentId(),
                                fullOrder.get("status"));

                // Keep strict validation; do not bypass missing or mismatched IDs.
                validateOrderReferences(fullOrder, payment);

                return buildCreateOrderResponse(
                                payment,
                                paypalOrderId,
                                getApprovalUrl(fullOrder));
        }

        // 2. CAPTURE PAYPAL PAYMENT

        @Transactional
        public Payment capturePayPalPayment(PayPalCaptureRequest request) {

                Payment payment = paymentRepository
                                .findByPaymentId(request.getPaymentId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Payment record not found"));

                if (request.getPaypalOrderId() == null
                                || payment.getPaypalOrderId() == null
                                || !payment.getPaypalOrderId().equals(
                                                request.getPaypalOrderId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal order does not match the payment record");
                }

                if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                        return payment;
                }

                if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT, "Payment is not pending");
                }

                Map<String, Object> order = getPayPalOrder(request.getPaypalOrderId());

                String orderStatus = String.valueOf(order.get("status"));

                if ("COMPLETED".equalsIgnoreCase(orderStatus)) {
                        return reconcileCompletedOrder(order, payment, request);
                }

                if (!"APPROVED".equalsIgnoreCase(orderStatus)) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "PayPal order is not approved for capture. Status: "
                                                        + orderStatus);
                }

                Map<String, Object> capturedOrder;

                try {
                        capturedOrder = paypalClient.post()
                                        .uri("/v2/checkout/orders/{id}/capture",
                                                        request.getPaypalOrderId())
                                        .headers(headers -> {
                                                headers.setBearerAuth(getAccessToken());
                                                headers.setContentType(MediaType.APPLICATION_JSON);
                                        })
                                        .body(Map.of())
                                        .retrieve()
                                        .body(Map.class);

                } catch (RestClientResponseException ex) {

                        // Recover only when PayPal confirms the order completed.
                        Map<String, Object> latestOrder = getPayPalOrder(request.getPaypalOrderId());

                        if ("COMPLETED".equalsIgnoreCase(
                                        String.valueOf(latestOrder.get("status")))) {
                                return reconcileCompletedOrder(
                                                latestOrder, payment, request);
                        }

                        log.warn("PayPal capture failed for order {} with HTTP status {}",
                                        request.getPaypalOrderId(), ex.getStatusCode());

                        throw ex;
                }

                if (capturedOrder == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "PayPal returned an empty capture response");
                }

                // Retrieve the order again to verify the persisted PayPal references.
                Map<String, Object> verifiedOrder = getPayPalOrder(request.getPaypalOrderId());

                return reconcileCompletedOrder(verifiedOrder, payment, request);
        }

        // 3. VALIDATE REFERENCES AND RECONCILE COMPLETED CAPTURE

        private Payment reconcileCompletedOrder(
                        Map<String, Object> order,
                        Payment payment,
                        PayPalCaptureRequest request) {

                if (!"COMPLETED".equalsIgnoreCase(
                                String.valueOf(order.get("status")))) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal order is not completed");
                }

                if (!request.getPaypalOrderId().equals(
                                String.valueOf(order.get("id"))) ||
                                !request.getPaypalOrderId().equals(
                                                payment.getPaypalOrderId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal order ID does not match");
                }

                validateOrderReferences(order, payment);

                Object unitsObject = order.get("purchase_units");

                if (!(unitsObject instanceof List<?> units)
                                || units.isEmpty()
                                || !(units.get(0) instanceof Map<?, ?> unit)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal order has no purchase unit");
                }

                Object paymentsObject = unit.get("payments");

                if (!(paymentsObject instanceof Map<?, ?> payments)
                                || !(payments.get("captures") instanceof List<?> captures)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal order has no capture details");
                }

                Map<?, ?> completedCapture = null;

                for (Object item : captures) {
                        if (item instanceof Map<?, ?> capture
                                        && "COMPLETED".equalsIgnoreCase(
                                                        String.valueOf(capture.get("status")))) {
                                completedCapture = capture;
                                break;
                        }
                }

                if (completedCapture == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No completed PayPal capture was found");
                }

                Object captureIdObject = completedCapture.get("id");
                Object captureAmountObject = completedCapture.get("amount");

                if (captureIdObject == null
                                || !(captureAmountObject instanceof Map<?, ?> captureAmount)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal capture details are incomplete");
                }

                String captureCurrency = String.valueOf(captureAmount.get("currency_code"));
                String captureValue = String.valueOf(captureAmount.get("value"));

                BigDecimal expectedAmount = BigDecimal.valueOf(payment.getAmount());

                BigDecimal actualAmount;

                try {
                        actualAmount = new BigDecimal(captureValue);
                } catch (NumberFormatException ex) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal returned an invalid capture amount");
                }

                if (payment.getCurrency() == null
                                || !payment.getCurrency().equalsIgnoreCase(captureCurrency)
                                || expectedAmount.compareTo(actualAmount) != 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Captured amount or currency does not match the payment");
                }

                // Update the linked case and payment only after validating PayPal.
                Case linkedCase = caseRepository
                                .findByCaseId(payment.getCaseId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Case not found for this payment"));

                payment.setPaypalCaptureId(String.valueOf(captureIdObject));
                payment.setProvider("PAYPAL");
                payment.setStatus("SUCCESS");
                linkedCase.setPaymentStatus("PAID");

                caseRepository.save(linkedCase);
                return paymentRepository.save(payment);
        }

        // Validate PayPal's stored custom_id and reference_id.
        // Never remove this check to bypass a mismatch.

        private void validateOrderReferences(
                        Map<String, Object> order,
                        Payment payment) {

                Object unitsObject = order.get("purchase_units");

                if (!(unitsObject instanceof List<?> units)
                                || units.isEmpty()
                                || !(units.get(0) instanceof Map<?, ?> unit)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal order has no purchase unit");
                }

                String paypalCustomId = unit.get("custom_id") == null
                                ? null
                                : String.valueOf(unit.get("custom_id"));

                String paypalReferenceId = unit.get("reference_id") == null
                                ? null
                                : String.valueOf(unit.get("reference_id"));

                // Diagnostic IDs only; never log access tokens or secrets.
                log.info(
                                "PayPal reference check: orderId={}, dbPaymentId={}, "
                                                + "paypalCustomId={}, dbCaseId={}, paypalReferenceId={}",
                                order.get("id"),
                                payment.getPaymentId(),
                                paypalCustomId,
                                payment.getCaseId(),
                                paypalReferenceId);

                if (!payment.getPaymentId().equals(paypalCustomId)
                                || !payment.getCaseId().equals(paypalReferenceId)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "PayPal payment references do not match");
                }
        }

        // 4. GET PAYPAL OAUTH ACCESS TOKEN

        private String getAccessToken() {

                MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
                form.add("grant_type", "client_credentials");

                Map<String, Object> tokenResponse = paypalClient.post()
                                .uri("/v1/oauth2/token")
                                .headers(headers -> {
                                        headers.setBasicAuth(clientId, clientSecret);
                                        headers.setContentType(
                                                        MediaType.APPLICATION_FORM_URLENCODED);
                                        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
                                })
                                .body(form)
                                .retrieve()
                                .body(Map.class);

                if (tokenResponse == null
                                || tokenResponse.get("access_token") == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Could not obtain a PayPal access token");
                }

                return String.valueOf(tokenResponse.get("access_token"));
        }

        // 5. GET PAYPAL ORDER DETAILS

        private Map<String, Object> getPayPalOrder(String orderId) {

                Map<String, Object> order = paypalClient.get()
                                .uri("/v2/checkout/orders/{id}", orderId)
                                .headers(headers -> headers.setBearerAuth(getAccessToken()))
                                .retrieve()
                                .body(Map.class);

                if (order == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Could not retrieve the PayPal order");
                }

                return order;
        }

        // 6. EXTRACT APPROVAL URL

        private String getApprovalUrl(Map<String, Object> order) {

                Object linksObject = order.get("links");

                if (linksObject instanceof List<?> links) {
                        for (Object item : links) {
                                if (item instanceof Map<?, ?> link
                                                && "approve".equals(
                                                                String.valueOf(link.get("rel")))
                                                && link.get("href") != null) {
                                        return String.valueOf(link.get("href"));
                                }
                        }
                }

                throw new ResponseStatusException(
                                HttpStatus.BAD_GATEWAY,
                                "PayPal did not return an approval URL");
        }

        // 7. BUILD CREATE-ORDER RESPONSE

        private CreateOrderResponse buildCreateOrderResponse(
                        Payment payment,
                        String paypalOrderId,
                        String approvalUrl) {

                return new CreateOrderResponse(
                                payment.getPaymentId(),
                                paypalOrderId,
                                approvalUrl,
                                BigDecimal.valueOf(payment.getAmount()).toPlainString(),
                                payment.getCurrency());
        }
}
