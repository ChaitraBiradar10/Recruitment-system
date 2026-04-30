package com.git.recruitment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_rounds")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewRound {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private JobApplication application;

    @Column(nullable = false)
    private Integer roundNumber;

    private String roundType;       // Aptitude, Technical Interview, Coding, etc.
    private LocalDate scheduledDate;
    private String scheduledTime;
    private String interviewMode;   // Online, In-person, Hybrid
    private String location;
    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private RoundStatus status;     // SCHEDULED, COMPLETED, CANCELLED

    private String result;          // PASS, FAIL, PENDING
    private Integer score;
    private String notes;
    private String feedback;

    @Column(updatable = false) private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = RoundStatus.SCHEDULED;
        if (result == null) result = "PENDING";
    }

    @PreUpdate protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RoundStatus {
        SCHEDULED, COMPLETED, CANCELLED
    }
}
