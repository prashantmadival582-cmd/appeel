package com.example._justice.controller;

import com.example._justice.dto.PaymentRequest;
import com.example._justice.dto.PayPalCaptureRequest;
import com.example._justice.service.PaymentService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long customerId = getCustomerId(jwt);

        return ResponseEntity.ok(
                paymentService.createPayment(request, customerId));
    }

    @PostMapping("/capture")
    public ResponseEntity<?> capturePayment(
            @Valid @RequestBody PayPalCaptureRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long customerId = getCustomerId(jwt);

        return ResponseEntity.ok(
                paymentService.capturePayPalPayment(request, customerId));
    }

    private Long getCustomerId(Jwt jwt) {

        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Customer authentication is required");
        }

        Object userId = jwt.getClaim("userId");

        if (userId instanceof Number number) {
            return number.longValue();
        }

        if (userId instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException ignored) {
                // Invalid customer ID claim
            }
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid customer authentication");
    }
}
