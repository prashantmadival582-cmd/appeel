
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

    @Column(nullable = false)
    private String caseId;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String status;

    // Currency for this payment
    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "SEK";

    // Payment provider: PAYPAL or RAZORPAY
    private String provider;

    // Retain Razorpay identifiers for historical records
    private String razorpayOrderId;
    private String razorpayPaymentId;

    // PayPal identifiers
    private String paypalOrderId;
    private String paypalCaptureId;
}
