package com.example._justice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public PasswordResetEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String email, String token) {

        String resetLink = frontendUrl
                + "/reset-password?token="
                + token;

        SimpleMailMessage mailMessage = new SimpleMailMessage();

        mailMessage.setFrom(senderEmail);
        mailMessage.setTo(email);

        mailMessage.setSubject("APPEEL - Password Reset Request");

        mailMessage.setText(
            "Hello,\n\n" +
            "We received a request to reset your APPEEL account password.\n\n" +
            "Click the link below to create a new password:\n\n" +
            resetLink +
            "\n\nThis link is valid for 30 minutes and can only be used once.\n\n" +
            "If you did not request a password reset, you can ignore this email.\n\n" +
            "Regards,\n" +
            "APPEEL Support Team"
        );

        mailSender.send(mailMessage);
    }
}