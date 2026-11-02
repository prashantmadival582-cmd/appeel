
package com.example._justice.controller;

import com.example._justice.dto.LawyerLoginRequest;
import com.example._justice.dto.LawyerRequest;
import com.example._justice.dto.LawyerResponse;
import com.example._justice.entity.Case;
import com.example._justice.entity.Lawyer;
import com.example._justice.security.JwtService;
import com.example._justice.service.CaseService;
import com.example._justice.service.LawyerService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lawyers")
public class LawyerController {

    private final LawyerService lawyerService;
    private final CaseService caseService;
    private final JwtService jwtService;

    public LawyerController(
            LawyerService lawyerService,
            CaseService caseService,
            JwtService jwtService) {
        this.lawyerService = lawyerService;
        this.caseService = caseService;
        this.jwtService = jwtService;
    }

    // Register Lawyer
    @PostMapping("/register")
    public ResponseEntity<?> registerLawyer(
            @Valid @RequestBody LawyerRequest request) {
        try {
            Lawyer lawyer = lawyerService.addLawyer(request);
            return ResponseEntity.ok(LawyerResponse.from(lawyer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Lawyer Login
    @PostMapping("/login")
    public ResponseEntity<?> loginLawyer(
            @RequestBody LawyerLoginRequest request) {
        try {
            Lawyer lawyer = lawyerService.loginLawyer(
                    request.getEmail(),
                    request.getPassword());

            String token = jwtService.generateToken(
                    lawyer.getId(),
                    lawyer.getEmail(),
                    "LAWYER");

            return ResponseEntity.ok(Map.of(
                    "message", "Lawyer login successful",
                    "token", token,
                    "role", "LAWYER",
                    "userId", lawyer.getId(),
                    "lawyer", LawyerResponse.from(lawyer)
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Invalid email or password"
                    ));
        }
    }

    // Logout
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // The frontend removes the stored JWT.
        return ResponseEntity.noContent().build();
    }

    // Get All Lawyers
    @GetMapping
    public ResponseEntity<List<LawyerResponse>> getAllLawyers() {
        List<LawyerResponse> lawyers = lawyerService.getAllLawyers()
                .stream()
                .map(LawyerResponse::from)
                .toList();

        return ResponseEntity.ok(lawyers);
    }

    // Get Lawyer By ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getLawyerById(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            Jwt jwt) {

        String role = jwt.getClaimAsString("role");
        Long loggedInLawyerId = getUserId(jwt);

        if ("LAWYER".equals(role)
                && !id.equals(loggedInLawyerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You cannot access another lawyer's details."
                    ));
        }

        if (!"LAWYER".equals(role) && !"ADMIN".equals(role)) {
            return forbidden();
        }

        Lawyer lawyer = lawyerService.getLawyerById(id);

        if (lawyer == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(LawyerResponse.from(lawyer));
    }

    // Update Lawyer Details (Admin Only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLawyer(
            @PathVariable Long id,
            @RequestBody LawyerRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            Jwt jwt) {

        if (!"ADMIN".equals(jwt.getClaimAsString("role"))) {
            return forbidden();
        }

        try {
            Lawyer lawyer = lawyerService.updateLawyer(id, request);

            if (lawyer == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(LawyerResponse.from(lawyer));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Update Availability (Lawyer Can Update Own Status Only)
    @PutMapping("/{id}/availability")
    public ResponseEntity<?> updateAvailability(
            @PathVariable Long id,
            @RequestParam String status,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            Jwt jwt) {

        String role = jwt.getClaimAsString("role");
        Long loggedInLawyerId = getUserId(jwt);

        if (!"LAWYER".equals(role)) {
            return forbidden();
        }

        if (!id.equals(loggedInLawyerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You can update only your own availability."
                    ));
        }

        try {
            Lawyer lawyer = lawyerService.updateAvailability(id, status);

            if (lawyer == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(LawyerResponse.from(lawyer));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get Cases Assigned to Logged-in Lawyer
    @GetMapping("/my-cases")
    public ResponseEntity<?> getMyCases(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            Jwt jwt) {

        if (!"LAWYER".equals(jwt.getClaimAsString("role"))) {
            return forbidden();
        }

        Long lawyerId = getUserId(jwt);
        List<Case> assignedCases =
                caseService.getCasesForLawyer(lawyerId);

        return ResponseEntity.ok(assignedCases);
    }

    // Update Case Status
    @PutMapping("/cases/{caseId}/status")
    public ResponseEntity<?> updateCaseStatus(
            @PathVariable String caseId,
            @RequestParam String status,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            Jwt jwt) {

        if (!"LAWYER".equals(jwt.getClaimAsString("role"))) {
            return forbidden();
        }

        Long lawyerId = getUserId(jwt);

        try {
            Case updatedCase = caseService.updateCaseStatusByLawyer(
                    caseId,
                    lawyerId,
                    status);

            if (updatedCase == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(updatedCase);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Safely Read User ID from JWT
    private Long getUserId(Jwt jwt) {
        Object userId = jwt.getClaim("userId");

        if (userId instanceof Number number) {
            return number.longValue();
        }

        if (userId instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                        "Invalid userId in JWT", e);
            }
        }

        throw new IllegalArgumentException(
                "Missing or invalid userId in JWT");
    }

    // Forbidden Response
    private ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "message",
                        "Your account does not have permission for this action."
                ));
    }
}
