package com.example._justice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalInvoiceResponse {

    private Long id;

    private String invoiceReference;

    private String caseId;

    private String customerEmail;

    private BigDecimal amount;

    private String currency;

    private String status;

    private String paypalOrderId;

    private String approvalUrl;

    private LocalDateTime createdAt;

    private LocalDateTime paidAt;
}