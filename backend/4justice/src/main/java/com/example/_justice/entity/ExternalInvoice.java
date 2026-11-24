package com.example._justice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "external_invoices",
    indexes = {
        @Index(name = "idx_external_invoice_case", columnList = "case_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_reference", nullable = false, length = 120)
    private String invoiceReference;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "SEK";

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(unique = true)
    private String paypalOrderId;

    @Column(unique = true)
    private String paypalCaptureId;

    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    @PrePersist
    private void setCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}