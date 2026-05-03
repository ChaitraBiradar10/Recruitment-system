package com.git.recruitment.event;

import com.git.recruitment.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserActionEventListener {
    private final EmailService emailService;

    @Async
    @EventListener
    public void handleUserAction(UserActionEvent event) {
        log.info("Sending admin action notification. userId={}, action={}",
                event.getUser().getId(), event.getActionType());
        emailService.sendUserActionEmail(event);
    }
}
