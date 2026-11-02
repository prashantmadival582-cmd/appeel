
package com.example._justice.controller;

import com.example._justice.entity.Case;
import com.example._justice.service.CaseService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example._justice.dto.AdminCustomerUpdateRequest;
import jakarta.validation.Valid;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cases")
public class CaseController {

    private final CaseService caseService;

    public CaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    // Get All Cases
    @GetMapping
    public ResponseEntity<List<Case>> getAllCases() {
        return ResponseEntity.ok(
                caseService.getAllCases()
        );
    }

    // Get Case By Case ID
    @GetMapping("/{caseId}")
    public ResponseEntity<?> getCaseByCaseId(
            @PathVariable String caseId) {

        Case caseData =
                caseService.getCaseByCaseId(caseId);

        if (caseData == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(caseData);
    }

    // Update Case Status
    @PutMapping("/{caseId}/status")
    public ResponseEntity<?> updateCaseStatus(
            @PathVariable String caseId,
            @RequestParam String status) {

        Case updatedCase =
                caseService.updateCaseStatus(
                        caseId,
                        status
                );

        if (updatedCase == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedCase);
    }

    // Assign Lawyer to Case
    @PutMapping("/{caseId}/assign-lawyer/{lawyerId}")
    public ResponseEntity<?> assignLawyer(
            @PathVariable String caseId,
            @PathVariable Long lawyerId) {

        try {
            Case updatedCase =
                    caseService.assignLawyer(
                            caseId,
                            lawyerId
                    );

            if (updatedCase == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(updatedCase);

        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    
@PutMapping("/{caseId}/customer")
public ResponseEntity<?> updateCustomerDetails(
        @PathVariable String caseId,
        @Valid @RequestBody AdminCustomerUpdateRequest request) {

    try {
        Case updatedCase = caseService.updateCustomerDetails(
                caseId, request);

        if (updatedCase == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedCase);

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));

    } catch (IllegalStateException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
    }
}

}
