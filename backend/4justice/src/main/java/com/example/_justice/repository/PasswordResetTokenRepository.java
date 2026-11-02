
package com.example._justice.repository;

import com.example._justice.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findByEmailAndRole(
            String email,
            String role
    );

    void deleteByEmailAndRole(String email, String role);
}
