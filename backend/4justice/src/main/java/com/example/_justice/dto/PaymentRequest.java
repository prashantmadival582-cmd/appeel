package com.example._justice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentRequest {

    @NotBlank(message = "Case type is required")
    @Size(max = 255, message = "Case type is too long")
    private String caseType;

    @NotBlank(message = "Case description is required")
    @Size(max = 10000, message = "Case description is too long")
    private String description;

    @NotBlank(message = "Submission key is required")
    @Size(min = 32, max = 64, message = "Invalid submission key")
    private String submissionKey;
}
