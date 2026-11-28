
package com.example._justice.service;

import com.example._justice.dto.CustomerCaseRequest;
import com.example._justice.entity.Case;
import com.example._justice.entity.Lawyer;
import com.example._justice.entity.CaseIdSequence;
import com.example._justice.entity.Customer;
import com.example._justice.repository.CaseRepository;
import com.example._justice.repository.LawyerRepository;
import com.example._justice.repository.CaseIdSequenceRepository;
import com.example._justice.repository.CustomerRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class CaseService {

    private final CaseRepository caseRepository;
    private final LawyerRepository lawyerRepository;
    private final CustomerRepository customerRepository;
    private final CaseIdSequenceRepository caseIdSequenceRepository;
    private final PasswordEncoder passwordEncoder;

    public CaseService(
            CaseRepository caseRepository,
            LawyerRepository lawyerRepository,
            CustomerRepository customerRepository,
            CaseIdSequenceRepository caseIdSequenceRepository,
            PasswordEncoder passwordEncoder) {

        this.caseRepository = caseRepository;
        this.lawyerRepository = lawyerRepository;
        this.customerRepository = customerRepository;
        this.caseIdSequenceRepository = caseIdSequenceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Customer submits a new case
    @Transactional
    public Case submitCase(CustomerCaseRequest request, Long customerId) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException(
                        "Customer account not found."));

        Case newCase = new Case();
        newCase.setCustomerName(customer.getName());
        newCase.setCustomerEmail(customer.getEmail());
        newCase.setCaseType(request.getCaseType());
        newCase.setDescription(request.getDescription());
        newCase.setCaseId(generateCaseId());
        newCase.setStatus("PENDING");
        newCase.setCustomer(customer);

        return caseRepository.save(newCase);
    }


    @Transactional
public Case createPaidCase(
        Long customerId,
        String caseType,
        String description) {

    Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new IllegalStateException(
                    "Customer account not found."));

    Case newCase = new Case();

    newCase.setCustomerName(customer.getName());
    newCase.setCustomerEmail(customer.getEmail());
    newCase.setCaseType(caseType);
    newCase.setDescription(description);
    newCase.setCaseId(generateCaseId());
    newCase.setStatus("PENDING");
    newCase.setPaymentStatus("PAID");
    newCase.setCustomer(customer);

    return caseRepository.saveAndFlush(newCase);
}

   private String generateCaseId() {

    LocalDate today = LocalDate.now(ZoneId.of("Europe/Stockholm"));

    // Use January 1 as the sequence key for the entire year
    LocalDate yearStart = LocalDate.of(today.getYear(), 1, 1);

    caseIdSequenceRepository.createSequenceIfMissing(yearStart);

    CaseIdSequence sequence = caseIdSequenceRepository
            .findByDateForUpdate(yearStart)
            .orElseThrow(() -> new IllegalStateException(
                    "Unable to initialize yearly case ID sequence."));

    int nextNumber = sequence.getLastNumber() + 1;

    // IDs use exactly three sequence digits
    if (nextNumber > 999) {
        throw new IllegalStateException(
                "The yearly case ID limit of 999 has been reached.");
    }

    sequence.setLastNumber(nextNumber);
    caseIdSequenceRepository.saveAndFlush(sequence);

    return today.getYear() + String.format("%03d", nextNumber);
}

    public List<Case> getCasesForCustomer(Long customerId) {
        return caseRepository.findByCustomer_IdOrderBySubmittedAtDesc(
                customerId);
    }

    public Optional<Case> getCaseForCustomer(
            String caseId, Long customerId) {

        return caseRepository.findByCaseIdAndCustomer_Id(
                caseId, customerId);
    }

    // Admin can view all cases
    public List<Case> getAllCases() {
        return caseRepository.findAll();
    }

    // Admin can search by Case ID
    public Case getCaseByCaseId(String caseId) {
        return caseRepository.findByCaseId(caseId).orElse(null);
    }

    // Admin can update case status
public Case updateCaseStatus(String caseId, String status) {

    Case existingCase = caseRepository
            .findByCaseId(caseId)
            .orElse(null);

    if (existingCase == null) {
        return null;
    }

    // A completed case is permanently locked
    if ("COMPLETED".equalsIgnoreCase(existingCase.getStatus())) {
        throw new RuntimeException(
                "A completed case cannot be changed.");
    }

    // Only PENDING is allowed until a lawyer is assigned
    if (existingCase.getLawyer() == null
            && !"PENDING".equalsIgnoreCase(status)) {
        throw new RuntimeException(
                "A lawyer must be assigned before changing the case status.");
    }

    // Accept only the statuses supported by the application
    if (status == null || !List.of(
            "PENDING",
            "IN_PROGRESS",
            "ASSIGNED",
            "COMPLETED",
            "RESOLVED",
            "CLOSED",
            "REJECTED",
            "CANCELLED"
    ).contains(status.toUpperCase())) {
        throw new RuntimeException("Invalid case status.");
    }

    existingCase.setStatus(status.toUpperCase());

    return caseRepository.save(existingCase);
}

    // Admin assigns Lawyer to Case
  // Admin assigns or reassigns Lawyer to Case
public Case assignLawyer(String caseId, Long lawyerId) {

    Case existingCase = caseRepository
            .findByCaseId(caseId)
            .orElse(null);

    if (existingCase == null) {
        return null;
    }

    // A completed case cannot receive or change its lawyer
    if ("COMPLETED".equalsIgnoreCase(existingCase.getStatus())) {
        throw new RuntimeException(
                "A lawyer cannot be assigned or reassigned to a completed case.");
    }

    Lawyer lawyer = lawyerRepository
            .findById(lawyerId)
            .orElse(null);

    if (lawyer == null) {
        return null;
    }

    // Only manually AVAILABLE lawyers can receive cases
    if (!"AVAILABLE".equalsIgnoreCase(lawyer.getAvailability())) {
        throw new RuntimeException("Lawyer is currently busy");
    }

    // Assign or replace the existing lawyer
    existingCase.setLawyer(lawyer);

    // Do not automatically change the case status
    return caseRepository.save(existingCase);
}

    // Lawyer updates assigned Case status
  // Lawyer updates assigned Case status
public Case updateCaseStatusByLawyer(
        String caseId,
        Long lawyerId,
        String status) {

    Case existingCase = caseRepository
            .findByCaseId(caseId)
            .orElse(null);

    if (existingCase == null) {
        return null;
    }

    // A completed case is permanently locked
    if ("COMPLETED".equalsIgnoreCase(existingCase.getStatus())) {
        throw new RuntimeException(
                "A completed case cannot be changed.");
    }

    Lawyer assignedLawyer = existingCase.getLawyer();

    if (assignedLawyer == null) {
        throw new RuntimeException(
                "No lawyer is assigned to this case");
    }

    if (!assignedLawyer.getId().equals(lawyerId)) {
        throw new RuntimeException(
                "This lawyer is not assigned to this case");
    }

    if (status == null || !List.of(
            "PENDING",
            "IN_PROGRESS",
            "ASSIGNED",
            "COMPLETED",
            "RESOLVED",
            "CLOSED",
            "REJECTED",
            "CANCELLED"
    ).contains(status.toUpperCase())) {
        throw new RuntimeException("Invalid case status.");
    }

    existingCase.setStatus(status.toUpperCase());

    return caseRepository.save(existingCase);
}

    // Get cases assigned to a specific lawyer
    public List<Case> getCasesForLawyer(Long lawyerId) {

        return caseRepository.findAll()
                .stream()
                .filter(item -> item.getLawyer() != null
                        && lawyerId.equals(item.getLawyer().getId()))
                .toList();
    }

    // Admin updates customer details and optionally changes password
    @Transactional
    public Case updateCustomerDetails(
            String caseId,
            com.example._justice.dto.AdminCustomerUpdateRequest request) {

        Case existingCase = caseRepository
                .findByCaseId(caseId)
                .orElse(null);

        if (existingCase == null) {
            return null;
        }

        Customer customer = existingCase.getCustomer();

        if (customer == null) {
            throw new IllegalStateException(
                    "No customer is linked to this case.");
        }

        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();

        customerRepository.findByEmailIgnoreCase(email)
                .filter(existing ->
                        !existing.getId().equals(customer.getId()))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "This email is already registered to another customer.");
                });

        customer.setName(name);
        customer.setEmail(email);
        customer.setPhone(phone);

        // Change password only when Admin provides a new password
        if (request.getPassword() != null
                && !request.getPassword().isBlank()) {

            customer.setPassword(
                    passwordEncoder.encode(request.getPassword())
            );
        }

        customerRepository.save(customer);

        // Keep the case's stored customer details synchronized
        existingCase.setCustomerName(name);
        existingCase.setCustomerEmail(email);

        return caseRepository.save(existingCase);
    }
}
