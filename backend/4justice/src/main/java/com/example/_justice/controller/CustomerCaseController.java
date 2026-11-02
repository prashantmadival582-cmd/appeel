
package com.example._justice.controller;

import com.example._justice.dto.CustomerCaseRequest;
import com.example._justice.dto.CustomerCaseResponse;
import com.example._justice.entity.Case;
import com.example._justice.service.CaseService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cases")
public class CustomerCaseController {

    private final CaseService caseService;

    public CustomerCaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    @PostMapping
    public ResponseEntity<?> submitCase(
            @Valid @RequestBody CustomerCaseRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        Long customerId = jwt.getClaim("userId");

        try {
            Case savedCase = caseService.submitCase(request, customerId);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(CustomerCaseResponse.from(savedCase));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyCases(
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        Long customerId = jwt.getClaim("userId");

        List<CustomerCaseResponse> cases = caseService
                .getCasesForCustomer(customerId)
                .stream()
                .map(CustomerCaseResponse::from)
                .toList();

        return ResponseEntity.ok(cases);
    }

    @GetMapping("/mine/{caseId}")
    public ResponseEntity<?> getMyCase(
            @PathVariable String caseId,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        Long customerId = jwt.getClaim("userId");

        return caseService.getCaseForCustomer(caseId, customerId)
                .<ResponseEntity<?>>map(customerCase ->
                        ResponseEntity.ok(
                                CustomerCaseResponse.from(customerCase)
                        ))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
