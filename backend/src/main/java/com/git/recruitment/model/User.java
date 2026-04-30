package com.git.recruitment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'User'") private String firstName;
    @Column(nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'User'") private String lastName;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false) private String password;
    @Column(nullable = false, unique = true) private String rollNumber;

    private String department;
    private String batchYear;
    private String phone;
    private String gender;
    private String dateOfBirth;
    private String cgpa;
    private String skills;
    private String linkedinUrl;
    private String coverNote;

    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private RegistrationStatus registrationStatus;
    @Enumerated(EnumType.STRING) private ApplicationStatus applicationStatus;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;

    @PrePersist protected void onCreate() {
        createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now();
        if (registrationStatus == null) registrationStatus = RegistrationStatus.PENDING;
        if (role == null) role = Role.STUDENT;
    }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Role { STUDENT, ADMIN }
    public enum RegistrationStatus { PENDING, APPROVED, REJECTED }
    public enum ApplicationStatus { NOT_SUBMITTED, SUBMITTED, UNDER_REVIEW, SHORTLISTED, REJECTED }
}
