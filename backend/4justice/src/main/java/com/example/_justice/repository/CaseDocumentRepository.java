package com.example._justice.repository;

import com.example._justice.entity.CaseDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseDocumentRepository
        extends JpaRepository<CaseDocument, Long> {

    List<CaseDocument> findByCaseId(String caseId);

    long countByCaseId(String caseId);

    List<CaseDocument> findAllByOrderByIdDesc();
}