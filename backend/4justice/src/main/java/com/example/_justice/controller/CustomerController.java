
package com.example._justice.controller;

import com.example._justice.dto.CustomerLoginRequest;
import com.example._justice.dto.CustomerProfile;
import com.example._justice.dto.CustomerRegistrationRequest;
import com.example._justice.entity.Customer;
import com.example._justice.security.JwtService;
import com.example._justice.service.CustomerService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final JwtService jwtService;

    public CustomerController(
            CustomerService customerService,
            JwtService jwtService) {
        this.customerService = customerService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(
            @Valid @RequestBody CustomerRegistrationRequest request) {

        try {
            Customer customer =
                    customerService.registerCustomer(request);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(CustomerProfile.from(customer));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginCustomer(
            @Valid @RequestBody CustomerLoginRequest request) {

        Optional<Customer> authenticatedCustomer =
                customerService.authenticate(request);

        if (authenticatedCustomer.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Invalid email or password."
                    ));
        }

        Customer customer = authenticatedCustomer.get();

        String token = jwtService.generateToken(
                customer.getId(),
                customer.getEmail(),
                "CUSTOMER"
        );

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "role", "CUSTOMER",
                "userId", customer.getId(),
                "customer", CustomerProfile.from(customer)
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentCustomer(
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        Object userIdClaim = jwt.getClaim("userId");

        if (!(userIdClaim instanceof Number)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid customer token."));
        }

        Long customerId = ((Number) userIdClaim).longValue();

        return customerService.findById(customerId)
                .<ResponseEntity<?>>map(customer ->
                        ResponseEntity.ok(CustomerProfile.from(customer)))
                .orElseGet(() -> ResponseEntity.status(
                        HttpStatus.UNAUTHORIZED
                ).body(Map.of(
                        "message", "Customer account not found."
                )));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT logout is handled by the frontend removing its stored token.
        return ResponseEntity.noContent().build();
    }
}
