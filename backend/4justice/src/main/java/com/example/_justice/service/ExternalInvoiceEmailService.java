
package com.example._justice.service;

import com.example._justice.entity.ExternalInvoice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class ExternalInvoiceEmailService {

    private static final Logger log =
            LoggerFactory.getLogger(ExternalInvoiceEmailService.class);

    private final RestClient resendClient;
    private final String apiKey;
    private final String senderEmail;
    private final String adminEmail;

    public ExternalInvoiceEmailService(
            @Value("${app.resend.api-key:}") String apiKey,
            @Value("${app.resend.from:}") String senderEmail,
            @Value("${app.resend.admin-email:appeel.support@gmail.com}") String adminEmail) {

        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.adminEmail = adminEmail;

        this.resendClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    private void sendEmail(
            String recipient,
            String subject,
            String content) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Resend API key is not configured."
            );
        }

        if (senderEmail == null || senderEmail.isBlank()) {
            throw new IllegalStateException(
                    "Resend sender email is not configured."
            );
        }

        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException(
                    "Email recipient is not configured."
            );
        }

        resendClient.post()
                .uri("/emails")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", senderEmail,
                        "to", List.of(recipient),
                        "subject", subject,
                        "text", content
                ))
                .retrieve()
                .toBodilessEntity();
    }

    // Send the initial external invoice email
    public void sendExternalInvoiceEmail(
            ExternalInvoice invoice,
            String approvalUrl) {

        String subject =
                "APPEEL - External Invoice " +
                invoice.getInvoiceReference();

        String content =
                "Hello,\n\n" +
                "APPEEL has issued an external invoice for your legal matter.\n\n" +
                "Invoice Reference: " + invoice.getInvoiceReference() + "\n" +
                "Amount: " + invoice.getAmount() + " SEK\n\n" +
                "Please review and approve your invoice using the link below:\n\n" +
                approvalUrl + "\n\n" +
                "Please complete the payment using the PayPal checkout page.\n\n" +
                "If you have questions, please contact APPEEL Support.\n\n" +
                "Regards,\nAPPEEL Support Team";

        sendEmail(invoice.getCustomerEmail(), subject, content);

        log.info(
                "External invoice email sent to customer: {}",
                invoice.getCustomerEmail()
        );
    }

    // Send payment confirmation to customer and admin
   public void sendPaymentConfirmationEmails(
        ExternalInvoice invoice) {

        // Customer confirmation
        try {
            String customerSubject =
                    "APPEEL - Payment Successful - " +
                    invoice.getInvoiceReference();

            String customerContent =
                    "Hello,\n\n" +
                    "Your payment has been successfully received by APPEEL.\n\n" +
                    "PAYMENT CONFIRMATION\n\n" +
                    "Invoice Reference: " + invoice.getInvoiceReference() + "\n" +
                    "Amount Paid: " + invoice.getAmount() + " SEK\n" +
                    "Payment Method: PayPal\n" +
                    "PayPal Transaction ID: " + invoice.getPaypalCaptureId() + "\n" +
                    "Payment Date: " + invoice.getPaidAt() + "\n\n" +
                    "Thank you for your payment. Your external invoice is now paid.\n\n" +
                    "If you have any questions, please contact APPEEL Support.\n\n" +
                    "Regards,\nAPPEEL Support Team";

            sendEmail(
                    invoice.getCustomerEmail(),
                    customerSubject,
                    customerContent
            );

            log.info(
                    "Payment confirmation email sent to customer: {}",
                    invoice.getCustomerEmail()
            );

        } catch (Exception e) {
            log.error(
                    "Failed to send payment confirmation email to customer: {}",
                    invoice.getCustomerEmail(),
                    e
            );
        }

        // Admin notification
        try {
            String adminSubject =
                    "APPEEL - External Invoice Payment Received - " +
                    invoice.getInvoiceReference();

            String adminContent =
                    "Hello APPEEL Admin,\n\n" +
                    "A customer has successfully completed an external invoice payment.\n\n" +
                    "PAYMENT RECEIVED\n\n" +
                    "Invoice Reference: " + invoice.getInvoiceReference() + "\n" +
                    "Customer Email: " + invoice.getCustomerEmail() + "\n" +
                    "Amount Paid: " + invoice.getAmount() + " SEK\n" +
                    "Payment Method: PayPal\n" +
                    "PayPal Transaction ID: " + invoice.getPaypalCaptureId() + "\n" +
                    "Payment Date: " + invoice.getPaidAt() + "\n\n" +
                    "The external invoice has been marked as paid in APPEEL.\n\n" +
                    "Regards,\nAPPEEL Payment Notification";

            sendEmail(adminEmail, adminSubject, adminContent);

            log.info(
                    "Payment notification email sent to admin: {}",
                    adminEmail
            );

        } catch (Exception e) {
            log.error(
                    "Failed to send payment notification email to admin: {}",
                    adminEmail,
                    e
            );
        }
    }
}
