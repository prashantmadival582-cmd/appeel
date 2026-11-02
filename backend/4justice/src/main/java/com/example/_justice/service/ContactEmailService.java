package com.example._justice.service;

import com.example._justice.dto.ContactRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ContactEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.contact.receiver}")
    private String receiverEmail;

    public ContactEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendContactEnquiry(ContactRequest request) {

        SimpleMailMessage mailMessage = new SimpleMailMessage();

        mailMessage.setFrom(senderEmail);
        mailMessage.setTo(receiverEmail);
        mailMessage.setReplyTo(request.getEmail());

        mailMessage.setSubject("APPEEL Website Enquiry: " + request.getSubject());

        mailMessage.setText(
            "New enquiry received through the APPEEL website.\n\n" +
            "Name: " + request.getName() + "\n" +
            "Email: " + request.getEmail() + "\n" +
            "Subject: " + request.getSubject() + "\n\n" +
            "Message:\n" + request.getMessage()
        );

        mailSender.send(mailMessage);
    }
}