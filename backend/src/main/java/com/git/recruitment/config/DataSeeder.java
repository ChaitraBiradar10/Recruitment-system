package com.git.recruitment.config;

import com.git.recruitment.model.User;
import com.git.recruitment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private static final String DEFAULT_ADMIN_EMAIL = "admin@students.git.edu";
    private static final String LEGACY_ADMIN_EMAIL = "admin@students.git.edu";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@1234";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            if (userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
                log.info("Default admin already exists -> {}", DEFAULT_ADMIN_EMAIL);
                return;
            }

            User legacyAdmin = userRepository.findByEmail(LEGACY_ADMIN_EMAIL).orElse(null);
            if (legacyAdmin != null) {
                legacyAdmin.setEmail(DEFAULT_ADMIN_EMAIL);
                legacyAdmin.setRole(User.Role.ADMIN);
                legacyAdmin.setRegistrationStatus(User.RegistrationStatus.APPROVED);
                userRepository.save(legacyAdmin);
                log.info("Migrated legacy admin {} -> {}", LEGACY_ADMIN_EMAIL, DEFAULT_ADMIN_EMAIL);
                return;
            }

            User admin = User.builder()
                    .firstName("Placement")
                    .lastName("Admin")
                    .email(DEFAULT_ADMIN_EMAIL)
                    .password(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                    .rollNumber(nextAdminRollNumber())
                    .role(User.Role.ADMIN)
                    .registrationStatus(User.RegistrationStatus.APPROVED)
                    .build();

            userRepository.save(admin);
            log.info("Default admin created -> {} / {}", DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
        } catch (Exception e) {
            log.error("Error creating default admin user", e);
        }
    }

    private String nextAdminRollNumber() {
        int idx = 1;
        while (true) {
            String candidate = String.format("ADMIN%03d", idx++);
            if (!userRepository.existsByRollNumber(candidate)) {
                return candidate;
            }
        }
    }
}
