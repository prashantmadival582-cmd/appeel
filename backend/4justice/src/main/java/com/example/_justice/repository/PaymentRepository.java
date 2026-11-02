
package com.example._justice.repository;

import com.example._justice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByCaseId(String caseId);

    Optional<Payment> findByPaymentId(String paymentId);
}
