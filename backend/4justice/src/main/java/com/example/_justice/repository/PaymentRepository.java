package com.example._justice.repository;

import com.example._justice.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByCaseId(String caseId);

    Optional<Payment> findByPaymentId(String paymentId);

    Optional<Payment> findBySubmissionKey(String submissionKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.paymentId = :paymentId")
    Optional<Payment> findByPaymentIdForUpdate(
        @Param("paymentId") String paymentId
    );
}
