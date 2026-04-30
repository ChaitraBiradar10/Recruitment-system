package com.git.recruitment.service;

import com.git.recruitment.dto.DTOs.*;
import com.git.recruitment.model.*;
import com.git.recruitment.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class StudentService {
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;

    @Value("${app.file.upload-dir}") private String uploadDir;

    private static final String[] ALLOWED = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    public StudentProfileResponse getProfile(String email) {
        User u = getUser(email);
        Optional<Resume> r = resumeRepository.findByUser(u);
        return buildProfile(u, r.orElse(null));
    }

    @Transactional
    public StudentProfileResponse updateProfile(String email, ProfileUpdateRequest req) {
        User u = getUser(email);
        if (req.getFirstName()   != null) u.setFirstName(req.getFirstName());
        if (req.getLastName()    != null) u.setLastName(req.getLastName());
        if (req.getPhone()       != null) u.setPhone(req.getPhone());
        if (req.getGender()      != null) u.setGender(req.getGender());
        if (req.getDateOfBirth() != null) u.setDateOfBirth(req.getDateOfBirth());
        if (req.getDepartment()  != null) u.setDepartment(req.getDepartment());
        if (req.getBatchYear()   != null) u.setBatchYear(req.getBatchYear());
        if (req.getCgpa()        != null) u.setCgpa(req.getCgpa());
        if (req.getSkills()      != null) u.setSkills(req.getSkills());
        if (req.getLinkedinUrl() != null) u.setLinkedinUrl(req.getLinkedinUrl());
        if (req.getCoverNote()   != null) u.setCoverNote(req.getCoverNote());
        userRepository.save(u);
        return buildProfile(u, resumeRepository.findByUser(u).orElse(null));
    }

    @Transactional
    public ResumeInfo uploadResume(String email, MultipartFile file) throws IOException {
        validateResumeFile(file);

        String ct = file.getContentType();

        User u = getUser(email);
        Path dir = Paths.get(uploadDir, String.valueOf(u.getId()));
        Files.createDirectories(dir);

        resumeRepository.findByUser(u).ifPresent(r -> {
            try { Files.deleteIfExists(Paths.get(r.getFilePath())); } catch (IOException ignored) {}
        });

        String ext = ct.equals("application/pdf") ? ".pdf" : ".docx";
        String storedName = UUID.randomUUID() + ext;
        Path fp = dir.resolve(storedName);
        Files.copy(file.getInputStream(), fp, StandardCopyOption.REPLACE_EXISTING);

        Resume resume = resumeRepository.findByUser(u).orElse(Resume.builder().user(u).build());
        resume.setOriginalFileName(file.getOriginalFilename());
        resume.setStoredFileName(storedName);
        resume.setFilePath(fp.toString());
        resume.setFileType(ct);
        resume.setFileSize(file.getSize());
        resumeRepository.save(resume);

        if (u.getApplicationStatus() == User.ApplicationStatus.NOT_SUBMITTED) {
            u.setApplicationStatus(User.ApplicationStatus.SUBMITTED);
            userRepository.save(u);
        }
        return buildResumeInfo(resume);
    }

    public void validateResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Resume is required.");

        String ct = file.getContentType();
        if (!Arrays.asList(ALLOWED).contains(ct))
            throw new IllegalArgumentException("Resume must be a PDF or DOCX file.");
        if (file.getSize() > 5 * 1024 * 1024)
            throw new IllegalArgumentException("Resume file size must not exceed 5 MB.");
    }

    public byte[] downloadResume(String email) throws IOException {
        User u = getUser(email);
        Resume r = resumeRepository.findByUser(u).orElseThrow(() -> new RuntimeException("No resume found"));
        return Files.readAllBytes(Paths.get(r.getFilePath()));
    }

    public Resume getResumeEntity(Long userId) {
        return resumeRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("No resume found"));
    }

    public User getUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private StudentProfileResponse buildProfile(User u, Resume r) {
        return StudentProfileResponse.builder()
                .id(u.getId()).firstName(u.getFirstName()).lastName(u.getLastName())
                .email(u.getEmail()).phone(u.getPhone()).gender(u.getGender())
                .dateOfBirth(u.getDateOfBirth()).department(u.getDepartment())
                .batchYear(u.getBatchYear()).cgpa(u.getCgpa()).rollNumber(u.getRollNumber())
                .skills(u.getSkills()).linkedinUrl(u.getLinkedinUrl()).coverNote(u.getCoverNote())
                .registrationStatus(u.getRegistrationStatus().name())
                .applicationStatus(u.getApplicationStatus() != null ? u.getApplicationStatus().name() : null)
                .createdAt(u.getCreatedAt())
                .resume(r != null ? buildResumeInfo(r) : null).build();
    }

    public ResumeInfo buildResumeInfo(Resume r) {
        return ResumeInfo.builder().id(r.getId()).originalFileName(r.getOriginalFileName())
                .fileType(r.getFileType()).fileSize(r.getFileSize()).uploadedAt(r.getUploadedAt()).build();
    }
}
