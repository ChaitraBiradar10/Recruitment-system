package com.git.recruitment.event;

import com.git.recruitment.model.User;

public class UserActionEvent {
    private final User user;
    private final UserActionType actionType;
    private final String message;

    public UserActionEvent(User user, UserActionType actionType, String message) {
        this.user = user;
        this.actionType = actionType;
        this.message = message;
    }

    public User getUser() {
        return user;
    }

    public UserActionType getActionType() {
        return actionType;
    }

    public String getMessage() {
        return message;
    }
}
