package com.git.recruitment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String title;
    @Column(nullable = false) private String companyName;
    @Column(length = 2000) private String description;
    private String location;
    private String jobType;         // Full-time, Internship, Contract
    private String salaryPackage;
    private String eligibleBranches;
    private String eligibleBatches;
    private Double minimumCgpa;
    private String skills;
    private LocalDate applicationDeadline;
    private Integer totalPositions;
    private Integer numberOfRounds;   // Number of interview rounds (2-5)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() {
        createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now();
        if (status == null) status = JobStatus.ACTIVE;
    }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum JobStatus { ACTIVE, CLOSED, DRAFT }
}
