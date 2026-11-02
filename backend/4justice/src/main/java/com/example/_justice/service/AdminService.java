package com.example._justice.service;

import com.example._justice.dto.AdminLoginRequest;
import com.example._justice.entity.Admin;
import com.example._justice.repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder) {

        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

   
public boolean login(AdminLoginRequest request) {

    String email = request.getEmail().trim().toLowerCase();

    System.out.println("Admin login attempted for: " + email);

    Admin admin = adminRepository
            .findByEmail(email)
            .orElse(null);

    if (admin == null) {
        System.out.println("Admin record not found.");
        return false;
    }

    boolean passwordMatches = passwordEncoder.matches(
            request.getPassword(),
            admin.getPassword()
    );

    System.out.println("Password matches stored hash: " + passwordMatches);

    return passwordMatches;
}

// Reset Admin Password
@Transactional
public void resetAdminPassword(String email, String newPassword) {

    Admin admin = adminRepository
            .findByEmailIgnoreCase(email.trim())
            .orElseThrow(() ->
                    new RuntimeException("Admin account not found"));

    admin.setPassword(passwordEncoder.encode(newPassword));

    adminRepository.save(admin);
}

}