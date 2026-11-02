package com.example._justice.repository;

import com.example._justice.entity.Lawyer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LawyerRepository extends JpaRepository<Lawyer, Long> {

    Optional<Lawyer> findByEmail(String email);
     Optional<Lawyer> findByEmailIgnoreCase(String email);
}