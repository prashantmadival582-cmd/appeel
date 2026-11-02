
package com.example._justice.controller;

import com.example._justice.dto.CustomerDocumentResponse;
import com.example._justice.service.CaseDocumentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/documents")
public class AdminDocumentController {

    private final CaseDocumentService caseDocumentService;

    public AdminDocumentController(
            CaseDocumentService caseDocumentService) {
        this.caseDocumentService = caseDocumentService;
    }

    @GetMapping
    public ResponseEntity<?> getAllDocuments() {

        List<CustomerDocumentResponse> documents =
                caseDocumentService.getAllDocuments()
                        .stream()
                        .map(CustomerDocumentResponse::from)
                        .toList();

        return ResponseEntity.ok(documents);
    }
}
