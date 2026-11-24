
package com.example._justice.service;

import com.example._justice.dto.ExternalInvoiceCaptureRequest;
import com.example._justice.dto.ExternalInvoiceRequest;
import com.example._justice.dto.ExternalInvoiceResponse;
import com.example._justice.entity.Case;
import com.example._justice.entity.ExternalInvoice;
import com.example._justice.repository.CaseRepository;
import com.example._justice.repository.ExternalInvoiceRepository;

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
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ExternalInvoiceService {

    private static final Logger log =
            LoggerFactory.getLogger(ExternalInvoiceService.class);

    private final ExternalInvoiceRepository invoiceRepository;
    private final CaseRepository caseRepository;
    private final ExternalInvoiceEmailService emailService;
    private final RestClient paypalClient;

    private final String clientId;
    private final String clientSecret;

    @Value("${external-invoice.return-url}")
    private String returnUrl;

    @Value("${external-invoice.cancel-url}")
    private String cancelUrl;

    @Value("${payment.currency:SEK}")
    private String currency;

    public ExternalInvoiceService(
            ExternalInvoiceRepository invoiceRepository,
            CaseRepository caseRepository,
            ExternalInvoiceEmailService emailService,
            @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}")
            String baseUrl,
            @Value("${paypal.client-id}") String clientId,
            @Value("${paypal.client-secret}") String clientSecret) {

        this.invoiceRepository = invoiceRepository;
        this.caseRepository = caseRepository;
        this.emailService = emailService;
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        this.paypalClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    // 1. CREATE EXTERNAL INVOICE

    @Transactional
    public ExternalInvoiceResponse createExternalInvoice(
            String caseId,
            ExternalInvoiceRequest request) {

        Case existingCase = caseRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Case not found"));

        BigDecimal amount = request.getAmount();

        if (amount == null
                || amount.signum() <= 0
                || amount.scale() > 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invoice amount must be positive and have at most two decimal places");
        }

        amount = amount.setScale(2, RoundingMode.UNNECESSARY);

        String invoiceReference = "EXAP-" + existingCase.getCaseId();

        ExternalInvoice invoice = ExternalInvoice.builder()
                .invoiceReference(invoiceReference)
                .caseId(existingCase.getCaseId())
                .customerEmail(existingCase.getCustomerEmail())
                .amount(amount)
                .currency(currency.trim().toUpperCase())
                .status("PENDING")
                .build();

        invoice = invoiceRepository.saveAndFlush(invoice);

        String encodedReference = java.net.URLEncoder.encode(
                invoiceReference, StandardCharsets.UTF_8);

        String encodedInvoiceId = String.valueOf(invoice.getId());

        String actualReturnUrl = appendQueryParameter(
                returnUrl,
                "invoiceId",
                encodedInvoiceId);

        String actualCancelUrl = appendQueryParameter(
                cancelUrl,
                "invoiceId",
                encodedInvoiceId);

        Map<String, Object> purchaseUnit = Map.of(
                "reference_id", invoice.getCaseId(),
                "custom_id", invoice.getId().toString(),
                "invoice_id", invoiceReference,
                "description", "APPEEL external invoice",
                "amount", Map.of(
                        "currency_code", invoice.getCurrency(),
                        "value", invoice.getAmount().toPlainString()));

        Map<String, Object> applicationContext = Map.of(
                "return_url", actualReturnUrl,
                "cancel_url", actualCancelUrl,
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

        invoice.setPaypalOrderId(paypalOrderId);
        invoiceRepository.saveAndFlush(invoice);

        Map<String, Object> fullOrder = getPayPalOrder(paypalOrderId);

        validateOrderReferences(fullOrder, invoice);

        String approvalUrl = getApprovalUrl(fullOrder);

        // Send invoice email to customer.
        emailService.sendExternalInvoiceEmail(invoice, approvalUrl);

        log.info(
                "External invoice created: invoiceId={}, reference={}, orderId={}",
                invoice.getId(),
                invoice.getInvoiceReference(),
                paypalOrderId);

        return buildResponse(invoice, approvalUrl);
    }

    // 2. GET ALL INVOICES FOR A CASE

    @Transactional(readOnly = true)
    public List<ExternalInvoiceResponse> getInvoicesByCaseId(
            String caseId) {

        if (!caseRepository.findByCaseId(caseId).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Case not found");
        }

        return invoiceRepository
                .findByCaseIdOrderByCreatedAtDesc(caseId)
                .stream()
                .map(invoice -> buildResponse(invoice, null))
                .toList();
    }

    // 3. CAPTURE EXTERNAL INVOICE PAYMENT

    @Transactional
    public ExternalInvoiceResponse captureExternalInvoice(
            ExternalInvoiceCaptureRequest request) {

        if (request.getPaypalOrderId() == null
                || request.getPaypalOrderId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal order ID is required");
        }

        ExternalInvoice invoice = invoiceRepository
                .findByPaypalOrderId(request.getPaypalOrderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "External invoice not found for this PayPal order"));

        if ("SUCCESS".equalsIgnoreCase(invoice.getStatus())) {
            return buildResponse(invoice, null);
        }

        if (!"PENDING".equalsIgnoreCase(invoice.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "External invoice is not pending");
        }

        Map<String, Object> order =
                getPayPalOrder(request.getPaypalOrderId());

        String orderStatus = String.valueOf(order.get("status"));

        if ("COMPLETED".equalsIgnoreCase(orderStatus)) {
            return reconcileCompletedOrder(order, invoice);
        }

        if (!"APPROVED".equalsIgnoreCase(orderStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "PayPal order is not approved for capture. Status: "
                            + orderStatus);
        }

        Map<String, Object> capturedOrder = paypalClient.post()
                .uri("/v2/checkout/orders/{id}/capture",
                        request.getPaypalOrderId())
                .headers(headers -> {
                    headers.setBearerAuth(getAccessToken());
                    headers.setContentType(MediaType.APPLICATION_JSON);
                })
                .body(Map.of())
                .retrieve()
                .body(Map.class);

        if (capturedOrder == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "PayPal returned an empty capture response");
        }

        Map<String, Object> verifiedOrder =
                getPayPalOrder(request.getPaypalOrderId());

        return reconcileCompletedOrder(verifiedOrder, invoice);
    }

    // 4. VERIFY COMPLETED PAYPAL CAPTURE

    private ExternalInvoiceResponse reconcileCompletedOrder(
            Map<String, Object> order,
            ExternalInvoice invoice) {

        if (!"COMPLETED".equalsIgnoreCase(
                String.valueOf(order.get("status")))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal order is not completed");
        }

        if (!invoice.getPaypalOrderId().equals(
                String.valueOf(order.get("id")))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal order ID does not match invoice");
        }

        validateOrderReferences(order, invoice);

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

        Object captureId = completedCapture.get("id");
        Object amountObject = completedCapture.get("amount");

        if (captureId == null || !(amountObject instanceof Map<?, ?> captureAmount)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal capture details are incomplete");
        }

        String captureCurrency =
                String.valueOf(captureAmount.get("currency_code"));

        String captureValue =
                String.valueOf(captureAmount.get("value"));

        BigDecimal actualAmount;

        try {
            actualAmount = new BigDecimal(captureValue);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid PayPal capture amount");
        }

        if (!invoice.getCurrency().equalsIgnoreCase(captureCurrency)
                || invoice.getAmount().compareTo(actualAmount) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Captured amount or currency does not match invoice");
        }

        // IMPORTANT:
        // Only update this external invoice.
        // Do not update Case.paymentStatus or the initial Payment entity.

        invoice.setPaypalCaptureId(String.valueOf(captureId));
        invoice.setStatus("SUCCESS");
        invoice.setPaidAt(LocalDateTime.now());

        ExternalInvoice savedInvoice =
        invoiceRepository.saveAndFlush(invoice);

log.info(
        "External invoice payment successful: invoiceId={}, caseId={}",
        savedInvoice.getId(),
        savedInvoice.getCaseId());

// Send confirmation emails after successful PayPal verification.
// Email failures are logged and do not undo the payment.
emailService.sendPaymentConfirmationEmails(savedInvoice);

return buildResponse(savedInvoice, null);
    }

    // 5. VALIDATE PAYPAL ORDER REFERENCES

    private void validateOrderReferences(
            Map<String, Object> order,
            ExternalInvoice invoice) {

        Object unitsObject = order.get("purchase_units");

        if (!(unitsObject instanceof List<?> units)
                || units.isEmpty()
                || !(units.get(0) instanceof Map<?, ?> unit)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal order has no purchase unit");
        }

        String customId = unit.get("custom_id") == null
                ? null
                : String.valueOf(unit.get("custom_id"));

        String referenceId = unit.get("reference_id") == null
                ? null
                : String.valueOf(unit.get("reference_id"));

        if (!invoice.getId().toString().equals(customId)
                || !invoice.getCaseId().equals(referenceId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "PayPal invoice references do not match");
        }
    }

    // 6. GET PAYPAL ACCESS TOKEN

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
                    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
                })
                .body(form)
                .retrieve()
                .body(Map.class);

        if (tokenResponse == null
                || tokenResponse.get("access_token") == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Could not obtain PayPal access token");
        }

        return String.valueOf(tokenResponse.get("access_token"));
    }

    // 7. GET PAYPAL ORDER

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
                    "Could not retrieve PayPal order");
        }

        return order;
    }

    // 8. EXTRACT APPROVAL URL

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
                "PayPal approval URL not found");
    }

    // 9. BUILD RESPONSE

    private ExternalInvoiceResponse buildResponse(
            ExternalInvoice invoice,
            String approvalUrl) {

        return ExternalInvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceReference(invoice.getInvoiceReference())
                .caseId(invoice.getCaseId())
                .customerEmail(invoice.getCustomerEmail())
                .amount(invoice.getAmount())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus())
                .paypalOrderId(invoice.getPaypalOrderId())
                .approvalUrl(approvalUrl)
                .createdAt(invoice.getCreatedAt())
                .paidAt(invoice.getPaidAt())
                .build();
    }

    // 10. APPEND URL QUERY PARAMETER

private String appendQueryParameter(
        String url,
        String key,
        String value) {

    String separator = url.contains("?") ? "&" : "?";

    return url + separator
            + java.net.URLEncoder.encode(
                    key, StandardCharsets.UTF_8)
            + "="
            + java.net.URLEncoder.encode(
                    value, StandardCharsets.UTF_8);
}
}
