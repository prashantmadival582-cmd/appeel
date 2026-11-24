package com.example._justice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ExternalInvoiceRequest {

    @NotNull(message = "Invoice amount is required")
    @DecimalMin(value = "0.01", message = "Invoice amount must be greater than zero")
    @Digits(integer = 10, fraction = 2, message = "Invoice amount must have at most two decimal places")
    private BigDecimal amount;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}