
package com.example._justice.repository;

import com.example._justice.entity.CaseIdSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface CaseIdSequenceRepository
        extends JpaRepository<CaseIdSequence, LocalDate> {

    @Modifying
    @Query(value = """
        INSERT IGNORE INTO case_id_sequences (case_date, last_number)
        VALUES (:caseDate, 0)
        """, nativeQuery = true)
    void createSequenceIfMissing(
            @Param("caseDate") LocalDate caseDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM CaseIdSequence s WHERE s.caseDate = :caseDate")
    Optional<CaseIdSequence> findByDateForUpdate(
            @Param("caseDate") LocalDate caseDate);
}
