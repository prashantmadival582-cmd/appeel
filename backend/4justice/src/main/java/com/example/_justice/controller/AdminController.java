
package com.example._justice.controller;

import com.example._justice.dto.AdminLoginRequest;
import com.example._justice.entity.Admin;
import com.example._justice.entity.Case;
import com.example._justice.entity.Lawyer;
import com.example._justice.repository.AdminRepository;
import com.example._justice.repository.LawyerRepository;
import com.example._justice.security.JwtService;
import com.example._justice.service.AdminService;
import com.example._justice.service.CaseService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final AdminRepository adminRepository;
    private final JwtService jwtService;
    private final CaseService caseService;
    private final LawyerRepository lawyerRepository;

    public AdminController(
            AdminService adminService,
            AdminRepository adminRepository,
            JwtService jwtService,
            CaseService caseService,
            LawyerRepository lawyerRepository) {

        this.adminService = adminService;
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
        this.caseService = caseService;
        this.lawyerRepository = lawyerRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody AdminLoginRequest request) {

        boolean authenticated = adminService.login(request);

        if (!authenticated) {
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "message", "Invalid email or password."
                    ));
        }

        Admin admin = adminRepository
                .findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow();

        String token = jwtService.generateToken(
                admin.getId(),
                admin.getEmail(),
                "ADMIN"
        );

        return ResponseEntity.ok(Map.of(
                "message", "Admin login successful.",
                "token", token,
                "role", "ADMIN",
                "userId", admin.getId(),
                "email", admin.getEmail()
        ));
    }

    // Admin views cases assigned to a specific lawyer
    @GetMapping("/lawyers/{lawyerId}/cases")
    public ResponseEntity<?> getCasesAssignedToLawyer(
            @PathVariable Long lawyerId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null
                || !"ADMIN".equalsIgnoreCase(
                        jwt.getClaimAsString("role"))) {

            return ResponseEntity.status(403)
                    .body(Map.of(
                            "message",
                            "Only administrators can view a lawyer's assigned cases."
                    ));
        }

        Lawyer lawyer = lawyerRepository.findById(lawyerId)
                .orElse(null);

        if (lawyer == null) {
            return ResponseEntity.status(404)
                    .body(Map.of(
                            "message", "Lawyer not found."
                    ));
        }

        List<Case> cases = caseService.getCasesForLawyer(lawyerId);

        return ResponseEntity.ok(cases);
    }
}
