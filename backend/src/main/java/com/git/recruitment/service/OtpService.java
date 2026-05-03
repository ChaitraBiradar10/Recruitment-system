package com.git.recruitment.service;

import com.git.recruitment.dto.DTOs.ApiResponse;
import com.git.recruitment.model.EmailOtp;
import com.git.recruitment.repository.EmailOtpRepository;
import com.git.recruitment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;

    private final EmailOtpRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.college.email-domain}")
    private String allowedDomain;

    @Transactional
    public ApiResponse sendRegistrationOtp(String email, String rollNumber) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedRollNumber = normalizeRollNumber(rollNumber);

        if (!normalizedEmail.endsWith(allowedDomain)) {
            log.warn("Registration OTP rejected: invalid domain. email={}", normalizedEmail);
            return ApiResponse.error("Only " + allowedDomain + " email addresses are allowed.");
        }
        if (!emailAndRollNumberPrefixesMatch(normalizedEmail, normalizedRollNumber)) {
            log.warn("Registration OTP rejected: email and roll number prefix mismatch. email={}, rollNumber={}",
                    normalizedEmail, normalizedRollNumber);
            return ApiResponse.error("First 7 characters of email ID and roll number must be same.");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("Registration OTP rejected: email already exists. email={}", normalizedEmail);
            return ApiResponse.error("An account with this email already exists.");
        }
        if (userRepository.existsByRollNumber(normalizedRollNumber)) {
            log.warn("Registration OTP rejected: roll number already exists. rollNumber={}", normalizedRollNumber);
            return ApiResponse.error("This roll number is already registered.");
        }

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        EmailOtp emailOtp = EmailOtp.builder()
                .email(normalizedEmail)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .verified(false)
                .consumed(false)
                .attempts(0)
                .build();

        otpRepository.save(emailOtp);
        emailService.sendRegistrationOtp(normalizedEmail, otp);
        return ApiResponse.ok("OTP sent to your college email. It is valid for 5 minutes.");
    }

    @Transactional
    public ApiResponse verifyRegistrationOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedOtp = otp != null ? otp.trim() : "";

        EmailOtp emailOtp = otpRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElse(null);

        if (emailOtp == null || emailOtp.isConsumed()) {
            return ApiResponse.error("Please request a new OTP.");
        }
        if (emailOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ApiResponse.error("OTP has expired. Please request a new OTP.");
        }
        if (emailOtp.getAttempts() >= MAX_ATTEMPTS) {
            return ApiResponse.error("Too many incorrect attempts. Please request a new OTP.");
        }
        if (!emailOtp.getOtp().equals(normalizedOtp)) {
            emailOtp.setAttempts(emailOtp.getAttempts() + 1);
            otpRepository.save(emailOtp);
            return ApiResponse.error("Invalid OTP.");
        }

        emailOtp.setVerified(true);
        otpRepository.save(emailOtp);
        return ApiResponse.ok("Email verified successfully.");
    }

    public boolean isRegistrationEmailVerified(String email) {
        String normalizedEmail = normalizeEmail(email);
        return otpRepository.findTopByEmailOrderByCreatedAtDesc(normalizedEmail)
                .filter(otp -> otp.isVerified() && !otp.isConsumed())
                .filter(otp -> !otp.getExpiresAt().isBefore(LocalDateTime.now()))
                .isPresent();
    }

    @Transactional
    public void consumeRegistrationOtp(String email) {
        otpRepository.findTopByEmailOrderByCreatedAtDesc(normalizeEmail(email))
                .filter(EmailOtp::isVerified)
                .ifPresent(otp -> {
                    otp.setConsumed(true);
                    otpRepository.save(otp);
                });
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }

    private String normalizeRollNumber(String rollNumber) {
        return rollNumber != null ? rollNumber.trim().toUpperCase() : "";
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
