
package com.example._justice.controller;

import com.example._justice.dto.CustomerDocumentResponse;
import com.example._justice.entity.Case;
import com.example._justice.entity.CaseDocument;
import com.example._justice.service.CaseDocumentService;
import com.example._justice.service.CaseService;

import org.springframework.http.HttpHeaders;
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
@RequestMapping("/api/cases")
public class CaseDocumentController {

    private final CaseDocumentService caseDocumentService;
    private final CaseService caseService;

    public CaseDocumentController(
            CaseDocumentService caseDocumentService,
            CaseService caseService) {
        this.caseDocumentService = caseDocumentService;
        this.caseService = caseService;
    }

    @PostMapping("/{caseId}/documents")
    public ResponseEntity<?> uploadDocument(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {

        if (!canAccessCase(caseId, jwt)) {
            return ResponseEntity.notFound().build();
        }

        try {
            CaseDocument document =
                    caseDocumentService.uploadDocument(caseId, file);

            return ResponseEntity.ok(
                    CustomerDocumentResponse.from(document));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "File upload failed."));
        }
    }

    @GetMapping("/{caseId}/documents")
    public ResponseEntity<?> getDocuments(
            @PathVariable String caseId,
            @AuthenticationPrincipal Jwt jwt) {

        if (!canAccessCase(caseId, jwt)) {
            return ResponseEntity.notFound().build();
        }

        List<CustomerDocumentResponse> documents =
                caseDocumentService.getDocumentsByCaseId(caseId)
                        .stream()
                        .map(CustomerDocumentResponse::from)
                        .toList();

        return ResponseEntity.ok(documents);
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<?> downloadDocument(
            @PathVariable Long documentId,
            @AuthenticationPrincipal Jwt jwt) {

        try {
            CaseDocument document =
                    caseDocumentService.getDocumentById(documentId);

            if (document == null
                    || !canAccessCase(document.getCaseId(), jwt)) {
                return ResponseEntity.notFound().build();
            }

            byte[] file =
                    caseDocumentService.downloadDocument(documentId);

            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            String safeFileName = document.getFileName()
                    .replace("\"", "")
                    .replace("\r", "")
                    .replace("\n", "");

            MediaType mediaType;

            try {
                mediaType = MediaType.parseMediaType(
                        document.getFileType());
            } catch (Exception e) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + safeFileName + "\"")
                    .contentType(mediaType)
                    .body(file);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "File download failed."));
        }
    }

    private boolean canAccessCase(String caseId, Jwt jwt) {

        if (jwt == null) {
            return false;
        }

        Case customerCase = caseService.getCaseByCaseId(caseId);

        if (customerCase == null) {
            return false;
        }

        String role = jwt.getClaimAsString("role");
        Long userId = jwt.getClaim("userId");

        if ("ADMIN".equals(role)) {
            return true;
        }

        if ("CUSTOMER".equals(role)) {
            return customerCase.getCustomer() != null
                    && userId != null
                    && userId.equals(
                            customerCase.getCustomer().getId());
        }

        if ("LAWYER".equals(role)) {
            return customerCase.getLawyer() != null
                    && userId != null
                    && userId.equals(
                            customerCase.getLawyer().getId());
        }

        return false;
    }
}
