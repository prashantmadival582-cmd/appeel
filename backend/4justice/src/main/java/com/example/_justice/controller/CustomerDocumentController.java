
package com.example._justice.controller;

import com.example._justice.dto.CustomerDocumentResponse;
import com.example._justice.entity.CaseDocument;
import com.example._justice.service.CaseDocumentService;
import com.example._justice.service.CaseService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers/me")
public class CustomerDocumentController {

    private final CaseService caseService;
    private final CaseDocumentService documentService;

    public CustomerDocumentController(
            CaseService caseService,
            CaseDocumentService documentService) {
        this.caseService = caseService;
        this.documentService = documentService;
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getMyDocuments(
            @AuthenticationPrincipal Jwt jwt) {

        Long customerId = getCustomerId(jwt);
        if (customerId == null) {
            return unauthorized();
        }

        List<CustomerDocumentResponse> documents = caseService
                .getCasesForCustomer(customerId)
                .stream()
                .flatMap(customerCase -> documentService
                        .getDocumentsByCaseId(customerCase.getCaseId())
                        .stream())
                .map(CustomerDocumentResponse::from)
                .toList();

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/cases/{caseId}/documents")
    public ResponseEntity<?> getCaseDocuments(
            @PathVariable String caseId,
            @AuthenticationPrincipal Jwt jwt) {

        Long customerId = getCustomerId(jwt);
        if (customerId == null) {
            return unauthorized();
        }

        if (caseService.getCaseForCustomer(caseId, customerId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<CustomerDocumentResponse> documents = documentService
                .getDocumentsByCaseId(caseId)
                .stream()
                .map(CustomerDocumentResponse::from)
                .toList();

        return ResponseEntity.ok(documents);
    }

    @PostMapping("/cases/{caseId}/documents")
    public ResponseEntity<?> uploadDocument(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {

        Long customerId = getCustomerId(jwt);
        if (customerId == null) {
            return unauthorized();
        }

        if (caseService.getCaseForCustomer(caseId, customerId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            CaseDocument document = documentService.uploadDocument(caseId, file);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(CustomerDocumentResponse.from(document));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "message",
                            "File upload failed. Please try again."
                    ));
        }
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<?> downloadDocument(
            @PathVariable Long documentId,
            @AuthenticationPrincipal Jwt jwt) {

        Long customerId = getCustomerId(jwt);
        if (customerId == null) {
            return unauthorized();
        }

        CaseDocument document = documentService.getDocumentById(documentId);

        if (document == null
                || caseService.getCaseForCustomer(
                        document.getCaseId(), customerId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] content = documentService.downloadDocument(documentId);

            if (content == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getFileName() + "\""
                    )
                    .contentType(
                            MediaType.parseMediaType(document.getFileType())
                    )
                    .body(content);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "message",
                            "File download failed. Please try again."
                    ));
        }
    }

    private Long getCustomerId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }

        Object userId = jwt.getClaim("userId");

        if (userId instanceof Number number) {
            return number.longValue();
        }

        if (userId instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }

    private static ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please sign in to continue."));
    }
}
