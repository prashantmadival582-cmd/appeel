
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

    public ContactEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendContactEnquiry(ContactRequest request) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(senderEmail);

        message.setReplyTo(request.getEmail());

        message.setSubject(
                "APPEEL Contact Enquiry: " + request.getSubject()
        );

        message.setText(
                "A new contact enquiry has been received.\n\n" +
                "Name: " + request.getName() + "\n" +
                "Email: " + request.getEmail() + "\n" +
                "Subject: " + request.getSubject() + "\n\n" +
                "Message:\n" + request.getMessage()
        );

        mailSender.send(message);
    }
}
