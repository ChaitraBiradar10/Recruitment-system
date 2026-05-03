package com.git.recruitment.event;

import com.git.recruitment.model.Job;

public class JobCreatedEvent {
    private final Job job;

    public JobCreatedEvent(Job job) {
        this.job = job;
    }

    public Job getJob() {
        return job;
    }
}
