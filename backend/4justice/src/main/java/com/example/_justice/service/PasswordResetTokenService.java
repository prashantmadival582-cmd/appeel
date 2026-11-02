package com.example._justice.service;

import com.example._justice.entity.PasswordResetToken;
import com.example._justice.repository.PasswordResetTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PasswordResetTokenService {

    private final PasswordResetTokenRepository tokenRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetTokenService(
            PasswordResetTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Transactional
    public String createResetToken(String email, String role) {

        // Remove previous reset tokens for this account.
        tokenRepository.deleteByEmailAndRole(email, role);

        // Generate a cryptographically secure random token.
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        // Store only the SHA-256 hash in the database.
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(email)
                .role(role)
                .tokenHash(tokenHash)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        // Return the original token for the email link.
        return rawToken;
    }

    public PasswordResetToken validateResetToken(String rawToken) {

        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = tokenRepository
                .findByTokenHash(tokenHash)
                .orElse(null);

        if (resetToken == null) {
            return null;
        }

        if (resetToken.isUsed()) {
            return null;
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return null;
        }

        return resetToken;
    }

    private String hashToken(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hashBytes = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder hexString = new StringBuilder();

            for (byte b : hashBytes) {
                hexString.append(String.format("%02x", b));
            }

            return hexString.toString();

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Unable to generate secure token hash",
                    exception
            );
        }
    }
}