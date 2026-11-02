package com.example._justice.service;

import com.example._justice.entity.Admin;
import com.example._justice.entity.Customer;
import com.example._justice.entity.Lawyer;
import com.example._justice.entity.PasswordResetToken;

import com.example._justice.repository.AdminRepository;
import com.example._justice.repository.CustomerRepository;
import com.example._justice.repository.LawyerRepository;
import com.example._justice.repository.PasswordResetTokenRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class ForgotPasswordService {

    private final CustomerRepository customerRepository;
    private final LawyerRepository lawyerRepository;
    private final AdminRepository adminRepository;
    private final PasswordResetTokenRepository tokenRepository;

    private final PasswordResetTokenService tokenService;
    private final PasswordResetEmailService emailService;

    private final CustomerService customerService;
    private final LawyerService lawyerService;
    private final AdminService adminService;

    public ForgotPasswordService(
            CustomerRepository customerRepository,
            LawyerRepository lawyerRepository,
            AdminRepository adminRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordResetTokenService tokenService,
            PasswordResetEmailService emailService,
            CustomerService customerService,
            LawyerService lawyerService,
            AdminService adminService) {

        this.customerRepository = customerRepository;
        this.lawyerRepository = lawyerRepository;
        this.adminRepository = adminRepository;
        this.tokenRepository = tokenRepository;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.customerService = customerService;
        this.lawyerService = lawyerService;
        this.adminService = adminService;
    }

    // Request password reset
    @Transactional
    public String forgotPassword(String email) {

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        Customer customer = customerRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);

        Lawyer lawyer = lawyerRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);

        Admin admin = adminRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);

        int accountCount = 0;

        if (customer != null) accountCount++;
        if (lawyer != null) accountCount++;
        if (admin != null) accountCount++;

        // Do not reveal whether an account exists.
        if (accountCount != 1) {
            return "If an account exists for this email, a password reset link has been sent.";
        }

        String role;

        if (customer != null) {
            role = "CUSTOMER";
        } else if (lawyer != null) {
            role = "LAWYER";
        } else {
            role = "ADMIN";
        }

        String rawToken = tokenService.createResetToken(
                normalizedEmail,
                role
        );

        emailService.sendPasswordResetEmail(
                normalizedEmail,
                rawToken
        );

        return "If an account exists for this email, a password reset link has been sent.";
    }

    // Verify reset token
    public boolean verifyResetToken(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            return false;
        }

        return tokenService.validateResetToken(rawToken) != null;
    }

    // Reset password
    @Transactional
    public boolean resetPassword(String rawToken, String newPassword) {

        PasswordResetToken resetToken =
                tokenService.validateResetToken(rawToken);

        if (resetToken == null) {
            return false;
        }

        String email = resetToken.getEmail();
        String role = resetToken.getRole();

        switch (role.toUpperCase(Locale.ROOT)) {

            case "CUSTOMER":
                customerService.resetCustomerPassword(email, newPassword);
                break;

            case "LAWYER":
                lawyerService.resetLawyerPassword(email, newPassword);
                break;

            case "ADMIN":
                adminService.resetAdminPassword(email, newPassword);
                break;

            default:
                return false;
        }

        // Mark token as used.
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Invalidate any other outstanding reset tokens.
        tokenRepository.deleteByEmailAndRole(email, role);

        return true;
    }
}