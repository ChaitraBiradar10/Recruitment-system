package com.git.recruitment.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DTOs {

    // ── Auth ─────────────────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "First name is required.")
        @Size(max = 50, message = "First name must be 50 characters or fewer.")
        @Pattern(regexp = "^[A-Za-z ]+$", message = "First name must contain letters only.")
        private String firstName;
        @NotBlank(message = "Last name is required.")
        @Size(max = 50, message = "Last name must be 50 characters or fewer.")
        @Pattern(regexp = "^[A-Za-z ]+$", message = "Last name must contain letters only.")
        private String lastName;
        @NotBlank(message = "College email is required.")
        @Email(message = "Enter a valid email address.")
        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@students\\.git\\.edu$", message = "Use your @students.git.edu email address.")
        private String email;
        @NotBlank(message = "Password is required.")
        @Size(min = 8, message = "Password must be at least 8 characters.")
        private String password;
        @NotBlank(message = "Roll number is required.")
        @Pattern(regexp = "^[A-Za-z0-9]+$", message = "Roll number must be alphanumeric.")
        private String rollNumber;
        @NotBlank(message = "Department is required.")
        private String department;
        @NotBlank(message = "Batch year is required.")
        @Pattern(regexp = "^20\\d{2}$", message = "Batch year must be a valid 4-digit year.")
        private String batchYear;
        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone number must be a valid 10-digit mobile number.")
        private String phone;
        @NotBlank(message = "Gender is required.")
        @Pattern(regexp = "^(Male|Female|Other)$", message = "Please select a valid gender.")
        private String gender;
        @NotBlank(message = "Date of birth is required.")
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Date of birth must be in YYYY-MM-DD format.")
        private String dateOfBirth;
        @NotBlank(message = "CGPA is required.")
        @Pattern(regexp = "^(10(\\.0{1,2})?|[0-9](\\.\\d{1,2})?)$", message = "CGPA must be between 0 and 10 with up to 2 decimal places.")
        private String cgpa;
        @NotBlank(message = "Skills are required.")
        private String skills;
        @NotBlank(message = "LinkedIn URL is required.")
        @Pattern(regexp = "^(?i)https?://(www\\.)?linkedin\\.com/.*$", message = "Enter a valid LinkedIn profile URL.")
        private String linkedinUrl;
        @NotBlank(message = "Cover note is required.")
        @Size(min = 20, max = 1000, message = "Cover note must be between 20 and 1000 characters.")
        private String coverNote;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank @Email private String email;
        @NotBlank @Size(min = 8) private String newPassword;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private String department;
        private String batchYear;
        private String skills;
        private String registrationStatus;
        private String applicationStatus;
        private Long userId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ApiResponse {
        private boolean success;
        private String message;
        private Object data;

        public static ApiResponse ok(String msg) { return new ApiResponse(true, msg, null); }
        public static ApiResponse ok(String msg, Object data) { return new ApiResponse(true, msg, data); }
        public static ApiResponse error(String msg) { return new ApiResponse(false, msg, null); }
    }

    // ── Profile ───────────────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ProfileUpdateRequest {
        private String firstName, lastName, phone, gender, dateOfBirth;
        private String department, batchYear, cgpa, rollNumber;
        private String skills, linkedinUrl, coverNote;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StudentProfileResponse {
        private Long id;
        private String firstName, lastName, email, phone, gender, dateOfBirth;
        private String department, batchYear, cgpa, rollNumber;
        private String skills, linkedinUrl, coverNote;
        private String registrationStatus, applicationStatus;
        private LocalDateTime createdAt;
        private ResumeInfo resume;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ResumeInfo {
        private Long id;
        private String originalFileName, fileType;
        private Long fileSize;
        private LocalDateTime uploadedAt;
    }

    // ── Job ──────────────────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class JobRequest {
        @NotBlank(message = "Job title is required.")
        @Size(min = 2, max = 100, message = "Job title must be between 2 and 100 characters.")
        @Pattern(regexp = "^[A-Za-z ]+$", message = "Job title must contain letters and spaces only.")
        private String title;
        @NotBlank(message = "Company name is required.")
        @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters.")
        @Pattern(regexp = "^[A-Za-z ]+$", message = "Company name must contain letters and spaces only.")
        private String companyName;
        @NotBlank(message = "Description is required.")
        @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters.")
        @Pattern(regexp = "^[A-Za-z0-9 .,;:()'\"/&+-]+$", message = "Description can contain letters, numbers, spaces, and basic punctuation only.")
        private String description;
        @NotBlank(message = "Location is required.")
        @Size(min = 2, max = 100, message = "Location must be between 2 and 100 characters.")
        @Pattern(regexp = "^[A-Za-z ,.-]+$", message = "Location must contain letters only.")
        private String location;
        @NotBlank(message = "Job type is required.")
        @Pattern(regexp = "^(Full-time|Internship|Contract|Part-time)$", message = "Please select a valid job type.")
        private String jobType;
        @NotBlank(message = "Salary/package is required.")
        @Pattern(regexp = "^\\d+(\\.\\d{1,2})?$", message = "Salary/package must be a valid positive number.")
        private String salaryPackage;
        @NotBlank(message = "Eligible departments are required.")
        @Pattern(regexp = "^(CSE|ECE|ME|CE|EE|IT|AI&DS|EEE|CHE|AERO|AUTO|BT|MCA)(\\s*,\\s*(CSE|ECE|ME|CE|EE|IT|AI&DS|EEE|CHE|AERO|AUTO|BT|MCA))*$", message = "Invalid depts.")
        private String eligibleBranches;
        @NotBlank(message = "Eligible batches are required.")
        @Pattern(regexp = "^20\\d{2}(\\s*,\\s*20\\d{2})*$", message = "Eligible batches must be valid 4-digit years.")
        private String eligibleBatches;
        @NotBlank(message = "Required skills are required.")
        @Pattern(regexp = "^[A-Za-z ]+(\\s*,\\s*[A-Za-z ]+)*$", message = "Skills must contain letters only and be comma separated.")
        private String skills;
        @NotNull(message = "Minimum CGPA is required.")
        @DecimalMin(value = "0.0", message = "Minimum CGPA must be at least 0.")
        @DecimalMax(value = "10.0", message = "Minimum CGPA must not exceed 10.")
        private Double minimumCgpa;
        @NotNull(message = "Application deadline is required.")
        @FutureOrPresent(message = "Application deadline must be today or a future date.")
        private LocalDate applicationDeadline;
        @NotNull(message = "Total positions is required.")
        @Min(value = 1, message = "Total positions must be at least 1.")
        @Max(value = 100000, message = "Total positions is too large.")
        private Integer totalPositions;
        @Min(value = 1, message = "Number of rounds must be at least 1.")
        @Max(value = 10, message = "Number of rounds must not exceed 10.")
        private Integer numberOfRounds;  // Number of interview rounds (2-5)
        @NotBlank(message = "Status is required.")
        @Pattern(regexp = "^(ACTIVE|DRAFT|CLOSED)$", message = "Status must be ACTIVE, DRAFT, or CLOSED.")
        private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class JobResponse {
        private Long id;
        private String title, companyName, description, location, jobType;
        private String salaryPackage, eligibleBranches, eligibleBatches, skills, status;
        private Double minimumCgpa;
        private LocalDate applicationDeadline;
        private Integer totalPositions;
        private Integer numberOfRounds;  // Number of interview rounds
        private LocalDateTime createdAt;
        private long applicantCount;
        private Boolean alreadyApplied;
        private String myApplicationStatus;
        private String myCurrentRoundDisplayStatus;
    }

    // ── Application ───────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ApplicationResponse {
        private Long id;
        private Long jobId;
        private String jobTitle, companyName;
        private String status;
        private Integer currentRoundNumber;
        private String currentRoundType;
        private String currentRoundStatus;
        private String currentRoundDisplayStatus;
        private Boolean aptitudeCleared;
        private Integer aptitudeScore;
        private String interviewDate, interviewTime, interviewMode;
        private String interviewResult, interviewNotes;
        private Boolean finalSelected;
        private LocalDateTime appliedAt;
        // For admin view
        private Long userId;
        private String studentName, studentEmail, rollNumber, department, cgpa;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class InterviewScheduleRequest {
        private String interviewDate;
        private String interviewTime;
        private String interviewMode;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AptitudeResultRequest {
        private Boolean cleared;
        private Integer score;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class InterviewResultRequest {
        private String result;
        private String notes;
        private Boolean finalSelected;
    }

    // ── Admin Dashboard ───────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardStats {
        private long totalStudents;
        private long pendingRegistrations;
        private long approvedStudents;
        private long activeJobs;
        private long totalApplications;
        private long shortlisted;
        private long selected;
    }

    // ── Admin Student View ────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AdminStudentView {
        private Long id;
        private String firstName, lastName, email, rollNumber;
        private String department, batchYear, cgpa, skills, phone;
        private String gender, dateOfBirth, linkedinUrl, coverNote;
        private String selectedCompanies, selectedJobTitles;
        private String registrationStatus, applicationStatus;
        private LocalDateTime createdAt, approvedAt;
        private boolean hasResume;
        private ResumeInfo resume;
    }

    // ── Round Scheduling ──────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class InterviewRoundRequest {
        private Integer roundNumber;
        private String roundType;
        private String scheduledDate;
        private String scheduledTime;
        private String interviewMode;  // Online, In-person, Hybrid
        private String location;
        private String description;
        private Boolean rescheduleExisting;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class InterviewRoundResponse {
        private Long id;
        private Integer roundNumber;
        private String roundType;
        private String scheduledDate, scheduledTime, interviewMode, location;
        private String description;
        private String status;
        private String result;
        private Integer score;
        private String notes;
        private String feedback;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RoundResultRequest {
        private Integer roundNumber;
        private String result;    // PASS, FAIL
        private Integer score;
        private String notes;
        private String feedback;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FinalDecisionRequest {
        private Boolean finalSelected;
        private String notes;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RoundSchedulingView {
        private Long applicationId;
        private Long jobId;
        private Long studentId;
        private String studentName, studentEmail, rollNumber;
        private String jobTitle, companyName;
        private Integer numberOfRounds;
        private Integer currentRound;
        private String jobApplicationStatus;
        private java.util.List<InterviewRoundResponse> rounds;
    }
}
