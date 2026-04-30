package com.git.recruitment.service;

import com.git.recruitment.dto.DTOs.*;
import com.git.recruitment.model.*;
import com.git.recruitment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class AdminService {
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository appRepository;
    private final EmailService emailService;
    private final StudentService studentService;

    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalStudents(userRepository.countByRole(User.Role.STUDENT))
                .pendingRegistrations(userRepository.countByRegistrationStatus(User.RegistrationStatus.PENDING))
                .approvedStudents(userRepository.countByRegistrationStatus(User.RegistrationStatus.APPROVED))
                .activeJobs(jobRepository.countByStatus(Job.JobStatus.ACTIVE))
                .totalApplications(appRepository.count())
                .shortlisted(userRepository.countByApplicationStatus(User.ApplicationStatus.SHORTLISTED))
                .selected(appRepository.countByStatus(JobApplication.AppStatus.SELECTED))
                .build();
    }

    public List<AdminStudentView> getAllStudents() {
        return userRepository.findByRole(User.Role.STUDENT).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::buildAdminView).collect(Collectors.toList());
    }

    public List<AdminStudentView> getSelectedStudents() {
        return userRepository.findByRole(User.Role.STUDENT).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(user -> {
                    try {
                        return buildAdminView(user);
                    } catch (RuntimeException ex) {
                        log.warn("Skipping selected-student view for user {} due to data issue: {}", user.getId(), ex.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .filter(view -> view.getSelectedCompanies() != null && !view.getSelectedCompanies().isBlank())
                .collect(Collectors.toList());
    }

    public List<AdminStudentView> getPendingRegistrations() {
        return userRepository.findByRegistrationStatusAndRole(
                User.RegistrationStatus.PENDING, User.Role.STUDENT).stream()
                .map(this::buildAdminView).collect(Collectors.toList());
    }

    @Transactional
    public AdminStudentView approveRegistration(Long id) {
        User u = getUser(id);
        u.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        u.setApprovedAt(LocalDateTime.now());
        userRepository.save(u);
        emailService.sendRegistrationApproved(u);
        return buildAdminView(u);
    }

    @Transactional
    public AdminStudentView rejectRegistration(Long id) {
        User u = getUser(id);
        u.setRegistrationStatus(User.RegistrationStatus.REJECTED);
        userRepository.save(u);
        emailService.sendRegistrationRejected(u);
        return buildAdminView(u);
    }

    @Transactional
    public AdminStudentView shortlistCV(Long id) {
        User u = getUser(id);
        u.setApplicationStatus(User.ApplicationStatus.SHORTLISTED);
        userRepository.save(u);
        emailService.sendCVShortlisted(u);
        return buildAdminView(u);
    }

    @Transactional
    public AdminStudentView rejectCV(Long id) {
        User u = getUser(id);
        u.setApplicationStatus(User.ApplicationStatus.REJECTED);
        userRepository.save(u);
        emailService.sendCVRejected(u);
        return buildAdminView(u);
    }

    @Transactional
    public AdminStudentView markUnderReview(Long id) {
        User u = getUser(id);
        u.setApplicationStatus(User.ApplicationStatus.UNDER_REVIEW);
        userRepository.save(u);
        return buildAdminView(u);
    }

    public AdminStudentView getStudentById(Long id) { return buildAdminView(getUser(id)); }

    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Student not found: " + id));
    }

    private AdminStudentView buildAdminView(User u) {
        Optional<Resume> r = resumeRepository.findByUser(u);
        List<JobApplication> selectedApplications = appRepository
                .findByUserAndFinalSelectedTrueOrderByUpdatedAtDesc(u);

        String selectedCompanies = selectedApplications.stream()
                .map(JobApplication::getJob)
                .filter(Objects::nonNull)
                .map(Job::getCompanyName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));

        String selectedJobTitles = selectedApplications.stream()
                .sorted(Comparator.comparing(JobApplication::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(JobApplication::getJob)
                .filter(Objects::nonNull)
                .map(Job::getTitle)
                .filter(title -> title != null && !title.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));

        return AdminStudentView.builder()
                .id(u.getId()).firstName(u.getFirstName()).lastName(u.getLastName())
                .email(u.getEmail()).rollNumber(u.getRollNumber()).department(u.getDepartment())
                .batchYear(u.getBatchYear()).cgpa(u.getCgpa()).skills(u.getSkills()).phone(u.getPhone())
                .gender(u.getGender()).dateOfBirth(u.getDateOfBirth())
                .linkedinUrl(u.getLinkedinUrl()).coverNote(u.getCoverNote())
                .selectedCompanies(selectedCompanies)
                .selectedJobTitles(selectedJobTitles)
                .registrationStatus(u.getRegistrationStatus() != null ? u.getRegistrationStatus().name() : null)
                .applicationStatus(u.getApplicationStatus() != null ? u.getApplicationStatus().name() : null)
                .createdAt(u.getCreatedAt()).approvedAt(u.getApprovedAt())
                .hasResume(r.isPresent())
                .resume(r.map(studentService::buildResumeInfo).orElse(null))
                .build();
    }
}
