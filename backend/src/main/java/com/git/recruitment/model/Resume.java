package com.git.recruitment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Resume {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false) private String originalFileName;
    @Column(nullable = false) private String storedFileName;
    @Column(nullable = false) private String filePath;
    @Column(nullable = false) private String fileType;
    private Long fileSize;

    @Column(updatable = false) private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { uploadedAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
