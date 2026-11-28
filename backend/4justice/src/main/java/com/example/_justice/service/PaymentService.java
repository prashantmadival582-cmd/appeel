
package com.example._justice.service;

import com.example._justice.dto.CreateOrderResponse;
import com.example._justice.dto.PaymentRequest;
import com.example._justice.dto.PayPalCaptureRequest;
import com.example._justice.entity.Case;
import com.example._justice.entity.Customer;
import com.example._justice.entity.Payment;
import com.example._justice.repository.CaseRepository;
import com.example._justice.repository.CustomerRepository;
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

    private static final Logger log =
            LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final CaseRepository caseRepository;
    private final CustomerRepository customerRepository;
    private final CaseService caseService;
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
            CustomerRepository customerRepository,
            CaseService caseService,
            @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}")
            String baseUrl,
            @Value("${paypal.client-id}") String clientId,
            @Value("${paypal.client-secret}") String clientSecret,
            @Value("${payment.currency:USD}") String currency,
            @Value("${payment.amount:99.00}") String amount) {

        this.paymentRepository = paymentRepository;
        this.caseRepository = caseRepository;
        this.customerRepository = customerRepository;
        this.caseService = caseService;

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

    // =========================================================
    // 1. CREATE INITIAL CASE PAYMENT
    // =========================================================

    @Transactional
    public CreateOrderResponse createPayment(
            PaymentRequest request,
            Long customerId) {

        if (customerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Customer authentication is required");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer account not found"));

        String caseType = request.getCaseType().trim();
        String description = request.getDescription().trim();
        String submissionKey = request.getSubmissionKey().trim();

        if (caseType.isBlank() || description.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Case type and description are required");
        }

        // Reuse the same payment for a repeated submission.
        var existingPayment =
                paymentRepository.findBySubmissionKey(submissionKey);

        Payment payment;

        if (existingPayment.isPresent()) {

            payment = existingPayment.get();

            if (!customerId.equals(payment.getCustomerId())
                    || !"INITIAL_CASE".equalsIgnoreCase(
                            payment.getPaymentPurpose())
                    || !caseType.equals(payment.getCaseType())
                    || !description.equals(payment.getCaseDescription())) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "This submission key is already associated with another submission");
            }

            if (!"PAYPAL".equalsIgnoreCase(payment.getProvider())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "This payment uses a different provider");
            }

            if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "This submission has already been paid");
            }

            if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Existing payment requires review");
            }

            // Never silently create a second PayPal order.
            if (payment.getPaypalOrderId() == null
                    || payment.getPaypalOrderId().isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Existing payment has no stored PayPal order ID. Please contact support before retrying.");
            }

            Map<String, Object> existingOrder =
                    getPayPalOrder(payment.getPaypalOrderId());

            validateOrderReferences(existingOrder, payment);

            String existingOrderStatus =
                    String.valueOf(existingOrder.get("status"));

            if ("CREATED".equalsIgnoreCase(existingOrderStatus)) {

                return buildCreateOrderResponse(
                        payment,
                        payment.getPaypalOrderId(),
                        getApprovalUrl(existingOrder));
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Existing PayPal order requires payment completion or review. Status: "
                            + existingOrderStatus);
        }

        // Create a pending payment WITHOUT creating a case.
        payment = new Payment();

        payment.setPaymentId("AP-" + UUID.randomUUID());
        payment.setCaseId(null);
        payment.setCustomerId(customerId);
        payment.setCustomerEmail(customer.getEmail());
        payment.setCaseType(caseType);
        payment.setCaseDescription(description);
        payment.setPaymentPurpose("INITIAL_CASE");
        payment.setSubmissionKey(submissionKey);
        payment.setAmount(amount.doubleValue());
        payment.setCurrency(currency);
        payment.setProvider("PAYPAL");
        payment.setStatus("PENDING");

        paymentRepository.saveAndFlush(payment);

        // Initial payment uses payment ID as PayPal reference.
        Map<String, Object> purchaseUnit = Map.of(
                "reference_id", payment.getPaymentId(),
                "custom_id", payment.getPaymentId(),
                "description", "APPEEL.SE case payment",
                "amount", Map.of(
                        "currency_code", payment.getCurrency(),
                        "value", BigDecimal.valueOf(payment.getAmount())
                                .toPlainString()
                )
        );

        Map<String, Object> applicationContext = Map.of(
                "return_url", returnUrl,
                "cancel_url", cancelUrl,
                "user_action", "PAY_NOW"
        );

        Map<String, Object> orderRequest = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(purchaseUnit),
                "application_context", applicationContext
        );

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

        payment.setPaypalOrderId(paypalOrderId);
        paymentRepository.saveAndFlush(payment);

        Map<String, Object> fullOrder =
                getPayPalOrder(paypalOrderId);

        validateOrderReferences(fullOrder, payment);

        log.info(
                "Initial PayPal order created: orderId={}, paymentId={}",
                paypalOrderId,
                payment.getPaymentId());

        return buildCreateOrderResponse(
                payment,
                paypalOrderId,
                getApprovalUrl(fullOrder));
    }

    // =========================================================
    // 2. CAPTURE PAYMENT
    // =========================================================

    @Transactional
    public Payment capturePayPalPayment(
            PayPalCaptureRequest request,
            Long customerId) {

        if (customerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Customer authentication is required");
        }

        // Lock the payment row to prevent concurrent captures
        // from creating multiple cases.
        Payment payment = paymentRepository
                .findByPaymentIdForUpdate(request.getPaymentId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Payment record not found"));

        verifyPaymentOwnership(payment, customerId);

        if (request.getPaypalOrderId() == null
                || payment.getPaypalOrderId() == null
                || !payment.getPaypalOrderId().equals(
                        request.getPaypalOrderId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal order does not match the payment record");
        }

        // Idempotency: return the same case after successful capture.
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            return payment;
        }

        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payment is not pending");
        }

        Map<String, Object> order =
                getPayPalOrder(request.getPaypalOrderId());

        String orderStatus = String.valueOf(order.get("status"));

        if ("COMPLETED".equalsIgnoreCase(orderStatus)) {
            return reconcileCompletedOrder(order, payment, request, customerId);
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
                    .uri(
                            "/v2/checkout/orders/{id}/capture",
                            request.getPaypalOrderId())
                    .headers(headers -> {
                        headers.setBearerAuth(getAccessToken());
                        headers.setContentType(MediaType.APPLICATION_JSON);
                    })
                    .body(Map.of())
                    .retrieve()
                    .body(Map.class);

        } catch (RestClientResponseException ex) {

            // Recover only if PayPal independently confirms completion.
            Map<String, Object> latestOrder =
                    getPayPalOrder(request.getPaypalOrderId());

            if ("COMPLETED".equalsIgnoreCase(
                    String.valueOf(latestOrder.get("status")))) {

                return reconcileCompletedOrder(
                        latestOrder, payment, request, customerId);
            }

            log.warn(
                    "PayPal capture failed: orderId={}, HTTP status={}",
                    request.getPaypalOrderId(),
                    ex.getStatusCode());

            throw ex;
        }

        if (capturedOrder == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "PayPal returned an empty capture response");
        }

        // Always retrieve the order again before trusting the capture.
        Map<String, Object> verifiedOrder =
                getPayPalOrder(request.getPaypalOrderId());

        return reconcileCompletedOrder(
                verifiedOrder, payment, request, customerId);
    }

    // =========================================================
    // 3. VERIFY OWNERSHIP
    // =========================================================

    private void verifyPaymentOwnership(
            Payment payment,
            Long customerId) {

        // New initial case payment.
        if ("INITIAL_CASE".equalsIgnoreCase(
                payment.getPaymentPurpose())) {

            if (payment.getCustomerId() == null
                    || !payment.getCustomerId().equals(customerId)) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "This payment does not belong to the authenticated customer");
            }

            return;
        }

        // Historical case-linked payment.
        // Preserve old payments whose customer_id may be NULL.
        if (payment.getCaseId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Payment ownership could not be verified");
        }

        if (payment.getCustomerId() != null
                && !payment.getCustomerId().equals(customerId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This payment does not belong to the authenticated customer");
        }

        caseRepository.findByCaseIdAndCustomer_Id(
                        payment.getCaseId(), customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "This payment does not belong to the authenticated customer"));
    }

    // =========================================================
    // 4. VERIFY CAPTURE AND CREATE CASE
    // =========================================================

    private Payment reconcileCompletedOrder(
            Map<String, Object> order,
            Payment payment,
            PayPalCaptureRequest request,
            Long customerId) {

        if (!"COMPLETED".equalsIgnoreCase(
                String.valueOf(order.get("status")))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal order is not completed");
        }

        if (!request.getPaypalOrderId().equals(
                String.valueOf(order.get("id")))
                || !request.getPaypalOrderId().equals(
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

        String captureId = String.valueOf(captureIdObject);
        String captureCurrency =
                String.valueOf(captureAmount.get("currency_code"));
        String captureValue =
                String.valueOf(captureAmount.get("value"));

        BigDecimal expectedAmount =
                BigDecimal.valueOf(payment.getAmount());

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

        // If this capture was already recorded, it must be the same capture.
        if (payment.getPaypalCaptureId() != null
                && !payment.getPaypalCaptureId().equals(captureId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "PayPal capture ID does not match the stored capture");
        }

        // -----------------------------------------------------
        // INITIAL CASE PAYMENT
        // -----------------------------------------------------

        if ("INITIAL_CASE".equalsIgnoreCase(
                payment.getPaymentPurpose())) {

            if (payment.getCaseId() == null) {

                // This is the ONLY point where the new case is created.
                // It runs only after PayPal's completed capture,
                // reference, capture ID, amount and currency checks.
                Case newCase = caseService.createPaidCase(
                        customerId,
                        payment.getCaseType(),
                        payment.getCaseDescription());

                payment.setCaseId(newCase.getCaseId());

            } else {

                // A case already linked to this payment is reused.
                caseRepository.findByCaseIdAndCustomer_Id(
                                payment.getCaseId(), customerId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "The case linked to this payment could not be verified"));
            }

        } else {

            // -------------------------------------------------
            // HISTORICAL CASE-LINKED PAYMENT
            // -------------------------------------------------

            Case linkedCase = caseRepository
                    .findByCaseIdAndCustomer_Id(
                            payment.getCaseId(), customerId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Case not found for this payment"));

            linkedCase.setPaymentStatus("PAID");
            caseRepository.save(linkedCase);
        }

        payment.setPaypalCaptureId(captureId);
        payment.setProvider("PAYPAL");
        payment.setStatus("SUCCESS");

        return paymentRepository.saveAndFlush(payment);
    }

    // =========================================================
    // 5. VALIDATE PAYPAL REFERENCES
    // =========================================================

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

        // Old payments reference their case ID.
        // New initial payments reference their payment ID.
        String expectedReferenceId = payment.getCaseId() == null
                ? payment.getPaymentId()
                : payment.getCaseId();

        log.info(
                "PayPal reference check: orderId={}, paymentId={}, "
                        + "customId={}, expectedReference={}, paypalReference={}",
                order.get("id"),
                payment.getPaymentId(),
                paypalCustomId,
                expectedReferenceId,
                paypalReferenceId);

        if (!payment.getPaymentId().equals(paypalCustomId)
                || !expectedReferenceId.equals(paypalReferenceId)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal payment references do not match");
        }
    }

    // =========================================================
    // 6. PAYPAL OAUTH ACCESS TOKEN
    // =========================================================

    private String getAccessToken() {

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add("grant_type", "client_credentials");

        Map<String, Object> tokenResponse = paypalClient.post()
                .uri("/v1/oauth2/token")
                .headers(headers -> {
                    headers.setBasicAuth(clientId, clientSecret);
                    headers.setContentType(
                            MediaType.APPLICATION_FORM_URLENCODED);
                    headers.setAccept(
                            List.of(MediaType.APPLICATION_JSON));
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

    // =========================================================
    // 7. GET PAYPAL ORDER
    // =========================================================

    private Map<String, Object> getPayPalOrder(String orderId) {

        Map<String, Object> order = paypalClient.get()
                .uri("/v2/checkout/orders/{id}", orderId)
                .headers(headers ->
                        headers.setBearerAuth(getAccessToken()))
                .retrieve()
                .body(Map.class);

        if (order == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not retrieve the PayPal order");
        }

        return order;
    }

    // =========================================================
    // 8. EXTRACT APPROVAL URL
    // =========================================================

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

    // =========================================================
    // 9. BUILD CREATE ORDER RESPONSE
    // =========================================================

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
