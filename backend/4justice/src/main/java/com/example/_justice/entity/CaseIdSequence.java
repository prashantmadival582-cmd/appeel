
package com.example._justice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "case_id_sequences")
@Getter
@Setter
@NoArgsConstructor
public class CaseIdSequence {

    @Id
    @Column(name = "case_date", nullable = false)
    private LocalDate caseDate;

    @Column(name = "last_number", nullable = false)
    private Integer lastNumber;

    public CaseIdSequence(LocalDate caseDate, Integer lastNumber) {
        this.caseDate = caseDate;
        this.lastNumber = lastNumber;
    }
}
