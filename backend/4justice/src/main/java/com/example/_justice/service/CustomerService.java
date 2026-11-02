package com.example._justice.service;

import com.example._justice.dto.CustomerLoginRequest;
import com.example._justice.dto.CustomerRegistrationRequest;
import com.example._justice.dto.AdminCustomerUpdateRequest;

import com.example._justice.entity.Customer;
import com.example._justice.repository.CustomerRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {

        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Customer Registration
    public Customer registerCustomer(
            CustomerRegistrationRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        if (customerRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException(
                    "Email is already registered");
        }

        Customer customer = new Customer();

        customer.setName(request.getName());
        customer.setEmail(email);
        customer.setPhone(request.getPhone());

        customer.setPassword(
                passwordEncoder.encode(request.getPassword()));

        return customerRepository.save(customer);
    }

    // Customer Login
    public Optional<Customer> authenticate(
            CustomerLoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        Customer customer = customerRepository
                .findByEmailIgnoreCase(email)
                .orElse(null);

        if (customer == null) {
            return Optional.empty();
        }

        return passwordEncoder.matches(
                request.getPassword(),
                customer.getPassword())
                ? Optional.of(customer)
                : Optional.empty();
    }

    // Find Customer By ID
    public Optional<Customer> findById(Long customerId) {
        return customerRepository.findById(customerId);
    }

    // Update Customer Details Without Changing Password
    @Transactional
    public Customer updateCustomerDetails(
            Long customerId,
            AdminCustomerUpdateRequest request) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() ->
                        new RuntimeException("Customer not found"));

        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();

        customerRepository.findByEmailIgnoreCase(email)
                .filter(existing ->
                        !existing.getId().equals(customerId))
                .ifPresent(existing -> {
                    throw new RuntimeException(
                            "Email is already registered to another customer");
                });

        customer.setName(name);
        customer.setEmail(email);
        customer.setPhone(phone);

        return customerRepository.save(customer);
    }

    // Reset Customer Password
    @Transactional
    public void resetCustomerPassword(
            String email,
            String newPassword) {

        Customer customer = customerRepository
                .findByEmailIgnoreCase(email.trim())
                .orElseThrow(() ->
                        new RuntimeException("Customer account not found"));

        customer.setPassword(
                passwordEncoder.encode(newPassword));

        customerRepository.save(customer);
    }
}