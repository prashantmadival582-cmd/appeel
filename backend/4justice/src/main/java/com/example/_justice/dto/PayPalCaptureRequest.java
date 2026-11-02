
package com.example._justice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PayPalCaptureRequest {

    @NotBlank
    private String paymentId;

    @NotBlank
    private String paypalOrderId;
}
