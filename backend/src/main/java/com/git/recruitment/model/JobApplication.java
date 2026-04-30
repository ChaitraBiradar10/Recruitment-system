package com.git.recruitment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_id"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppStatus status;

    // Selection process fields
    private Boolean aptitudeCleared;
    private Integer aptitudeScore;
    private String interviewDate;
    private String interviewTime;
    private String interviewMode;   // Online / In-person
    private String interviewResult; // Pass / Fail / Pending
    private String interviewNotes;
    private Boolean finalSelected;
    private Integer currentRound;  // Current round number being evaluated

    @Column(updatable = false) private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() {
        appliedAt = LocalDateTime.now(); updatedAt = LocalDateTime.now();
        if (status == null) status = AppStatus.APPLIED;
    }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum AppStatus {
        APPLIED, APTITUDE_SCHEDULED, APTITUDE_CLEARED, APTITUDE_FAILED,
        INTERVIEW_SCHEDULED, SELECTED, REJECTED
    }
}
