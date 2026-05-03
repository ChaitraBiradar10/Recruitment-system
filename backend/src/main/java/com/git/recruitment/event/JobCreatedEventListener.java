package com.git.recruitment.event;

import com.git.recruitment.model.User;
import com.git.recruitment.repository.UserRepository;
import com.git.recruitment.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobCreatedEventListener {
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Async
    @EventListener
    public void handleJobCreated(JobCreatedEvent event) {
        List<User> approvedStudents = userRepository.findByRegistrationStatusAndRole(
                User.RegistrationStatus.APPROVED,
                User.Role.STUDENT
        );

        log.info("Sending new job notification to {} approved students. jobId={}",
                approvedStudents.size(), event.getJob().getId());

        approvedStudents.forEach(student -> {
            try {
                emailService.sendNewJobNotification(student, event.getJob());
            } catch (RuntimeException ex) {
                log.warn("Failed to send new job notification. userId={}, jobId={}, error={}",
                        student.getId(), event.getJob().getId(), ex.getMessage());
            }
        });
    }
}
