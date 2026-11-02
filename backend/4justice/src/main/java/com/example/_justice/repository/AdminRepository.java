package com.example._justice.repository;

import com.example._justice.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmail(String email);
     Optional<Admin> findByEmailIgnoreCase(String email);
}