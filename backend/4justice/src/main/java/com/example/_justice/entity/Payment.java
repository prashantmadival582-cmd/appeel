package com.example._justice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String paymentId;

    // NULL until PayPal payment is successfully verified
    @Column(name = "case_id")
    private String caseId;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String status;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "SEK";

    // Payment provider: PAYPAL or RAZORPAY
    private String provider;

    // Existing Razorpay identifiers
    private String razorpayOrderId;
    private String razorpayPaymentId;

    // Existing PayPal identifiers
    private String paypalOrderId;
    private String paypalCaptureId;

    // Customer who initiated the initial case payment
    @Column(name = "customer_id")
    private Long customerId;

    // Case details stored before successful payment
    @Column(name = "case_type")
    private String caseType;

    @Column(name = "case_description", columnDefinition = "TEXT")
    private String caseDescription;

    // Example: INITIAL_CASE
    @Column(name = "payment_purpose", length = 50)
    private String paymentPurpose;

    // Unique key used to prevent duplicate payment attempts
    @Column(name = "submission_key", length = 64)
    private String submissionKey;
}
