package com.example._justice.dto;

import jakarta.validation.constraints.NotBlank;

public class ExternalInvoiceCaptureRequest {

    @NotBlank(message = "PayPal order ID is required")
    private String paypalOrderId;

    public String getPaypalOrderId() {
        return paypalOrderId;
    }

    public void setPaypalOrderId(String paypalOrderId) {
        this.paypalOrderId = paypalOrderId;
    }
}