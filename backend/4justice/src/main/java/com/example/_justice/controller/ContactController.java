
package com.example._justice.controller;

import com.example._justice.dto.ContactRequest;
import com.example._justice.service.ContactEmailService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactEmailService contactEmailService;

    public ContactController(ContactEmailService contactEmailService) {
        this.contactEmailService = contactEmailService;
    }

    @PostMapping
    public ResponseEntity<?> sendContactEnquiry(
            @Valid @RequestBody ContactRequest request) {

        try {
            contactEmailService.sendContactEnquiry(request);

            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "message", "Your enquiry has been sent successfully."
                )
            );

        } catch (Exception e) {

            // Temporary debugging
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(
                Map.of(
                    "success", false,
                    "message", "Unable to send your enquiry. Please try again later."
                )
            );
        }
    }
}
