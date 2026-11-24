
package com.example._justice.controller;

import com.example._justice.dto.ExternalInvoiceCaptureRequest;
import com.example._justice.dto.ExternalInvoiceRequest;
import com.example._justice.dto.ExternalInvoiceResponse;
import com.example._justice.service.ExternalInvoiceService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ExternalInvoiceController {

    private final ExternalInvoiceService externalInvoiceService;

    public ExternalInvoiceController(
            ExternalInvoiceService externalInvoiceService) {
        this.externalInvoiceService = externalInvoiceService;
    }

    // ADMIN: CREATE AN EXTERNAL INVOICE

    @PostMapping("/admin/cases/{caseId}/external-invoices")
    public ResponseEntity<ExternalInvoiceResponse> createExternalInvoice(
            @PathVariable String caseId,
            @Valid @RequestBody ExternalInvoiceRequest request) {

        ExternalInvoiceResponse response =
                externalInvoiceService.createExternalInvoice(
                        caseId, request);

        return ResponseEntity.ok(response);
    }

    // ADMIN: GET ALL EXTERNAL INVOICES FOR A CASE

    @GetMapping("/admin/cases/{caseId}/external-invoices")
    public ResponseEntity<List<ExternalInvoiceResponse>> getInvoices(
            @PathVariable String caseId) {

        return ResponseEntity.ok(
                externalInvoiceService.getInvoicesByCaseId(caseId));
    }

    // CUSTOMER: CAPTURE EXTERNAL INVOICE PAYMENT

    @PostMapping("/external-invoices/capture")
    public ResponseEntity<ExternalInvoiceResponse> captureExternalInvoice(
            @Valid @RequestBody ExternalInvoiceCaptureRequest request) {

        return ResponseEntity.ok(
                externalInvoiceService.captureExternalInvoice(request));
    }
}
