package com.git.recruitment.service;

import com.git.recruitment.dto.DTOs.*;
import com.git.recruitment.model.User;
import com.git.recruitment.repository.UserRepository;
import com.git.recruitment.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Arrays;

@Service @RequiredArgsConstructor @Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final StudentService studentService;
    private final OtpService otpService;

    @Value("${app.college.email-domain}") private String allowedDomain;

    @Transactional
    public ApiResponse register(RegisterRequest req, MultipartFile resume) {
        normalizeRegisterRequest(req);

        if (!req.getEmail().endsWith(allowedDomain))
            return ApiResponse.error("Only " + allowedDomain + " email addresses are allowed.");
        if (!emailAndRollNumberPrefixesMatch(req.getEmail(), req.getRollNumber()))
            return ApiResponse.error("First 7 characters of email ID and roll number must be same.");
        if (!otpService.isRegistrationEmailVerified(req.getEmail()))
            return ApiResponse.error("Please verify your email OTP before registration.");
        if (userRepository.existsByEmail(req.getEmail()))
            return ApiResponse.error("An account with this email already exists.");
        if (userRepository.existsByRollNumber(req.getRollNumber()))
            return ApiResponse.error("This roll number is already registered.");
        if (req.getSkills().split(",").length == 0 || Arrays.stream(req.getSkills().split(",")).map(String::trim).noneMatch(s -> !s.isEmpty()))
            return ApiResponse.error("Please enter at least one skill.");
        if (Arrays.stream(req.getSkills().split(",")).map(String::trim).anyMatch(s -> !s.matches(".*[A-Za-z].*")))
            return ApiResponse.error("Skills cannot be numbers only.");
        if (!req.getCoverNote().matches(".*[A-Za-z].*"))
            return ApiResponse.error("Cover note cannot be numbers only.");

        try {
            LocalDate dob = LocalDate.parse(req.getDateOfBirth());
            if (!dob.isBefore(LocalDate.of(2010, 1, 1)))
                return ApiResponse.error("Invalid DOB.");
        } catch (DateTimeParseException e) {
            return ApiResponse.error("Invalid DOB.");
        }

        try {
            studentService.validateResumeFile(resume);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(e.getMessage());
        }

        User user = User.builder()
                .firstName(req.getFirstName()).lastName(req.getLastName())
                .email(req.getEmail()).password(passwordEncoder.encode(req.getPassword()))
                .rollNumber(req.getRollNumber()).department(req.getDepartment())
                .batchYear(req.getBatchYear()).phone(req.getPhone())
                .gender(req.getGender()).dateOfBirth(req.getDateOfBirth())
                .cgpa(req.getCgpa()).skills(req.getSkills())
                .linkedinUrl(req.getLinkedinUrl()).coverNote(req.getCoverNote())
                .role(User.Role.STUDENT)
                .registrationStatus(User.RegistrationStatus.PENDING)
                .applicationStatus(User.ApplicationStatus.NOT_SUBMITTED)
                .build();
        userRepository.save(user);

        try {
            studentService.uploadResume(req.getEmail(), resume);
        } catch (Exception e) {
            throw new RuntimeException("Resume upload failed: " + e.getMessage(), e);
        }

        try {
            emailService.sendRegistrationReceived(user);
        } catch (Exception e) {
            log.warn("Registration saved, but confirmation email could not be queued. userId={}, email={}, error={}",
                    user.getId(), user.getEmail(), e.getMessage());
        }
        otpService.consumeRegistrationOtp(user.getEmail());
        return ApiResponse.ok("Registration submitted. Awaiting admin approval.");
    }

    public AuthResponse login(LoginRequest req) {
        User existing = userRepository.findByEmail(req.getEmail()).orElse(null);
        boolean isAdmin = existing != null && existing.getRole() == User.Role.ADMIN;

        if (!isAdmin && !req.getEmail().endsWith(allowedDomain))
            throw new BadCredentialsException("Only " + allowedDomain + " accounts are allowed.");

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("User not found."));

        if (user.getRole() == User.Role.STUDENT &&
            user.getRegistrationStatus() != User.RegistrationStatus.APPROVED)
            throw new BadCredentialsException("Your account is " +
                user.getRegistrationStatus().name().toLowerCase() + ". Awaiting admin approval.");

        UserDetails ud = userDetailsService.loadUserByUsername(req.getEmail());
        String token = jwtUtil.generateToken(ud, user.getRole().name());

        return AuthResponse.builder()
                .token(token).email(user.getEmail())
                .firstName(user.getFirstName()).lastName(user.getLastName())
                .role(user.getRole().name())
                .department(user.getDepartment()).batchYear(user.getBatchYear()).skills(user.getSkills())
                .registrationStatus(user.getRegistrationStatus().name())
                .applicationStatus(user.getApplicationStatus() != null ? user.getApplicationStatus().name() : null)
                .userId(user.getId()).build();
    }

    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElse(null);

        if (user == null || user.getRole() != User.Role.STUDENT) {
            return ApiResponse.error("Password reset is available only for registered student accounts.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ApiResponse.ok("Password updated successfully. Please sign in with your new password.");
    }

    private void normalizeRegisterRequest(RegisterRequest req) {
        req.setFirstName(req.getFirstName().trim());
        req.setLastName(req.getLastName().trim());
        req.setEmail(req.getEmail().trim().toLowerCase());
        req.setPassword(req.getPassword().trim());
        req.setRollNumber(req.getRollNumber().trim().toUpperCase());
        req.setDepartment(req.getDepartment().trim());
        req.setBatchYear(req.getBatchYear().trim());
        req.setPhone(req.getPhone().trim());
        req.setGender(req.getGender().trim());
        req.setDateOfBirth(req.getDateOfBirth().trim());
        req.setCgpa(req.getCgpa().trim());
        req.setSkills(req.getSkills().trim());
        req.setLinkedinUrl(req.getLinkedinUrl().trim());
        req.setCoverNote(req.getCoverNote().trim());
    }

    private boolean emailAndRollNumberPrefixesMatch(String email, String rollNumber) {
        String emailId = email != null ? email.split("@")[0].trim().toLowerCase() : "";
        String normalizedRollNumber = rollNumber != null ? rollNumber.trim().toLowerCase() : "";
        if (emailId.length() < 7 || normalizedRollNumber.length() < 7) {
            return false;
        }
        return emailId.substring(0, 7).equals(normalizedRollNumber.substring(0, 7));
    }
}
