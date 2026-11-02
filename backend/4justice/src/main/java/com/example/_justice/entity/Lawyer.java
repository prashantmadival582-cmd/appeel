package com.example._justice.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "lawyers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lawyer {


@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false)
private String name;

@Column(nullable = false, unique = true)
private String email;

@JsonIgnore
@Column(nullable = false)
private String password;

@Column(nullable = false)
private String specialization;

@Column(nullable = false)
private String phone;

@Column(nullable = false)
private String availability;


}
