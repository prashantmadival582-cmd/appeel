package com.example._justice.service;

import com.example._justice.dto.LawyerRequest;
import com.example._justice.entity.Lawyer;
import com.example._justice.repository.LawyerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class LawyerService {


private final LawyerRepository lawyerRepository;
private final PasswordEncoder passwordEncoder;

public LawyerService(
        LawyerRepository lawyerRepository,
        PasswordEncoder passwordEncoder) {
    this.lawyerRepository = lawyerRepository;
    this.passwordEncoder = passwordEncoder;
}

// Register Lawyer
public Lawyer addLawyer(LawyerRequest request) {

    String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

    if (lawyerRepository.findByEmail(email).isPresent()) {
        throw new IllegalArgumentException(
                "A lawyer with this email already exists"
        );
    }

    Lawyer lawyer = new Lawyer();

    lawyer.setName(request.getName().trim());
    lawyer.setEmail(email);
    lawyer.setPassword(
            passwordEncoder.encode(request.getPassword())
    );
    lawyer.setSpecialization(request.getSpecialization().trim());
    lawyer.setPhone(request.getPhone().trim());
    lawyer.setAvailability("AVAILABLE");

    return lawyerRepository.save(lawyer);
}

// Get All Lawyers
public List<Lawyer> getAllLawyers() {
    return lawyerRepository.findAll();
}

// Get Lawyer By ID
public Lawyer getLawyerById(Long id) {
    return lawyerRepository.findById(id).orElse(null);
}

// Update Lawyer Details Without Changing Password
public Lawyer updateLawyer(Long id, LawyerRequest request) {

    Lawyer lawyer = lawyerRepository.findById(id).orElse(null);

    if (lawyer == null) {
        return null;
    }

    String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

    boolean emailUsedByAnotherLawyer =
            lawyerRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .isPresent();

    if (emailUsedByAnotherLawyer) {
        throw new IllegalArgumentException(
                "This email is already used by another lawyer"
        );
    }

    lawyer.setName(request.getName().trim());
    lawyer.setEmail(email);
    lawyer.setSpecialization(request.getSpecialization().trim());
    lawyer.setPhone(request.getPhone().trim());

    return lawyerRepository.save(lawyer);
}

// Update Lawyer Availability
public Lawyer updateAvailability(Long id, String availability) {

    Lawyer lawyer = lawyerRepository.findById(id).orElse(null);

    if (lawyer == null) {
        return null;
    }

    if (availability == null ||
            (!availability.equalsIgnoreCase("AVAILABLE")
                    && !availability.equalsIgnoreCase("BUSY"))) {
        throw new IllegalArgumentException(
                "Availability must be AVAILABLE or BUSY"
        );
    }

    lawyer.setAvailability(availability.toUpperCase(Locale.ROOT));

    return lawyerRepository.save(lawyer);
}

// Lawyer Login
public Lawyer loginLawyer(String email, String password) {

    String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

    Lawyer lawyer = lawyerRepository.findByEmail(normalizedEmail)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Invalid email or password"
                    )
            );

    if (!passwordEncoder.matches(password, lawyer.getPassword())) {
        throw new IllegalArgumentException(
                "Invalid email or password"
        );
    }

    return lawyer;
}


// Reset Lawyer Password
@Transactional
public void resetLawyerPassword(String email, String newPassword) {

    Lawyer lawyer = lawyerRepository
            .findByEmailIgnoreCase(email.trim())
            .orElseThrow(() ->
                    new RuntimeException("Lawyer account not found"));

    lawyer.setPassword(passwordEncoder.encode(newPassword));

    lawyerRepository.save(lawyer);
}



}
