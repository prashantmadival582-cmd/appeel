
package com.example._justice.service;

import com.example._justice.entity.ExternalInvoice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ExternalInvoiceEmailService {

    private static final Logger log =
            LoggerFactory.getLogger(ExternalInvoiceEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public ExternalInvoiceEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Send the initial external invoice email
    public void sendExternalInvoiceEmail(
            ExternalInvoice invoice,
            String approvalUrl) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(invoice.getCustomerEmail());

        message.setSubject(
                "APPEEL - External Invoice " + invoice.getInvoiceReference()
        );

        message.setText(
                "Hello,\n\n" +
                "APPEEL has issued an external invoice for your legal matter.\n\n" +
                "Invoice Reference: " + invoice.getInvoiceReference() + "\n" +
                "Case ID: " + invoice.getCaseId() + "\n" +
                "Amount: " + invoice.getAmount().toPlainString() + " " +
                        invoice.getCurrency() + "\n\n" +
                "To complete your payment securely using PayPal, click the link below:\n\n" +
                approvalUrl + "\n\n" +
                "Please complete the payment using the PayPal checkout page.\n\n" +
                "If you have questions, please contact APPEEL Support.\n\n" +
                "Regards,\nAPPEEL Support Team"
        );

        mailSender.send(message);
    }

    // Send payment confirmation to customer and admin
    public void sendPaymentConfirmationEmails(
            ExternalInvoice invoice) {

        // Customer confirmation
        try {
            SimpleMailMessage customerMessage = new SimpleMailMessage();

            customerMessage.setFrom(senderEmail);
            customerMessage.setTo(invoice.getCustomerEmail());

            customerMessage.setSubject(
                    "APPEEL - Payment Successful - " +
                            invoice.getInvoiceReference()
            );

            customerMessage.setText(
                    "Hello,\n\n" +
                    "Your payment has been successfully received by APPEEL.\n\n" +
                    "PAYMENT CONFIRMATION\n\n" +
                    "Invoice Reference: " + invoice.getInvoiceReference() + "\n" +
                    "Case ID: " + invoice.getCaseId() + "\n" +
                    "Amount Paid: " + invoice.getAmount().toPlainString() +
                            " " + invoice.getCurrency() + "\n" +
                    "Payment Status: SUCCESS\n" +
                    "PayPal Transaction ID: " + invoice.getPaypalCaptureId() + "\n" +
                    "Payment Date: " + invoice.getPaidAt() + "\n\n" +
                    "Thank you for your payment. Your external invoice is now paid.\n\n" +
                    "If you have any questions, please contact APPEEL Support.\n\n" +
                    "Regards,\nAPPEEL Support Team"
            );

            mailSender.send(customerMessage);

            log.info(
                    "Payment confirmation email sent to customer: {}",
                    invoice.getCustomerEmail()
            );

        } catch (Exception ex) {
            log.error(
                    "Could not send payment confirmation to customer: {}",
                    invoice.getCustomerEmail(),
                    ex
            );
        }

        // Admin notification
        try {
            SimpleMailMessage adminMessage = new SimpleMailMessage();

            adminMessage.setFrom(senderEmail);
            adminMessage.setTo(senderEmail);

            adminMessage.setSubject(
                    "APPEEL - External Invoice Payment Received - " +
                            invoice.getInvoiceReference()
            );

            adminMessage.setText(
                    "Hello APPEEL Admin,\n\n" +
                    "A customer has successfully completed an external invoice payment.\n\n" +
                    "PAYMENT RECEIVED\n\n" +
                    "Invoice Reference: " + invoice.getInvoiceReference() + "\n" +
                    "Case ID: " + invoice.getCaseId() + "\n" +
                    "Customer Email: " + invoice.getCustomerEmail() + "\n" +
                    "Amount Received: " + invoice.getAmount().toPlainString() +
                            " " + invoice.getCurrency() + "\n" +
                    "Payment Status: SUCCESS\n" +
                    "PayPal Transaction ID: " + invoice.getPaypalCaptureId() + "\n" +
                    "Payment Date: " + invoice.getPaidAt() + "\n\n" +
                    "The external invoice has been marked as paid in APPEEL.\n\n" +
                    "Regards,\nAPPEEL Payment Notification"
            );

            mailSender.send(adminMessage);

            log.info(
                    "Payment notification email sent to admin: {}",
                    senderEmail
            );

        } catch (Exception ex) {
            log.error(
                    "Could not send external invoice payment notification to admin",
                    ex
            );
        }
    }
}
