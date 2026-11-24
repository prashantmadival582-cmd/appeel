package com.example._justice.repository;

import com.example._justice.entity.ExternalInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExternalInvoiceRepository extends JpaRepository<ExternalInvoice, Long> {

    // Get all external invoices for a case
    List<ExternalInvoice> findByCaseIdOrderByCreatedAtDesc(String caseId);

    // Find an invoice using its internal database ID
    Optional<ExternalInvoice> findByIdAndCaseId(Long id, String caseId);

    // Find an invoice using its PayPal order ID
    Optional<ExternalInvoice> findByPaypalOrderId(String paypalOrderId);

    // Count invoices already created for a case
    long countByCaseId(String caseId);
}