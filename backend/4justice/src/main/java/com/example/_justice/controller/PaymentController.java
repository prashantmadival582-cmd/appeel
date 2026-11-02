
package com.example._justice.controller;

import com.example._justice.dto.PaymentRequest;
import com.example._justice.dto.PayPalCaptureRequest;
import com.example._justice.service.PaymentService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(
                paymentService.createPayment(request));
    }

    @PostMapping("/capture")
    public ResponseEntity<?> capturePayment(
            @Valid @RequestBody PayPalCaptureRequest request) {
        return ResponseEntity.ok(
                paymentService.capturePayPalPayment(request));
    }
}
