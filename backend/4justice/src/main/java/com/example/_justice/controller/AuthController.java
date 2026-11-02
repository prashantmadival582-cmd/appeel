package com.example._justice.controller;

import com.example._justice.dto.ForgotPasswordRequest;
import com.example._justice.dto.ResetPasswordRequest;
import com.example._justice.service.ForgotPasswordService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ForgotPasswordService forgotPasswordService;

    public AuthController(
            ForgotPasswordService forgotPasswordService) {

        this.forgotPasswordService = forgotPasswordService;
    }

    // Request Password Reset
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        String message = forgotPasswordService.forgotPassword(
                request.getEmail()
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", message
                )
        );
    }

    // Verify Reset Token
    @PostMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(
            @RequestParam String token) {

        boolean valid = forgotPasswordService.verifyResetToken(token);

        if (!valid) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "valid", false,
                            "message", "Invalid or expired password reset link."
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "valid", true,
                        "message", "Password reset link is valid."
                )
        );
    }

    // Reset Password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        boolean reset = forgotPasswordService.resetPassword(
                request.getToken(),
                request.getNewPassword()
        );

        if (!reset) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Invalid or expired password reset link."
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Your password has been reset successfully."
                )
        );
    }
}