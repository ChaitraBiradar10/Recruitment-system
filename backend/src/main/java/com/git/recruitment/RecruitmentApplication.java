package com.git.recruitment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EntityScan(basePackages = "com.git.recruitment.model")
@EnableJpaRepositories(basePackages = "com.git.recruitment.repository")
public class RecruitmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecruitmentApplication.class, args);
    }
}