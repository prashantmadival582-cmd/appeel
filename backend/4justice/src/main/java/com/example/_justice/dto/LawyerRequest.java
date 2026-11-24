
package com.example._justice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LawyerRequest {

    @NotBlank(message = "Lawyer name is required")
    private String name;

    @NotBlank(message = "Lawyer email is required")
    @Email(message = "Enter a valid email")
    private String email;

    @Size(min = 8, message = "Password must contain at least 8 characters")
    private String password;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String availability;
}
