package com.git.recruitment.repository;

import com.git.recruitment.model.InterviewRound;
import com.git.recruitment.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InterviewRoundRepository extends JpaRepository<InterviewRound, Long> {
    List<InterviewRound> findByApplication(JobApplication application);
    List<InterviewRound> findByApplicationOrderByRoundNumberAsc(JobApplication application);
    Optional<InterviewRound> findByApplicationAndRoundNumber(JobApplication application, Integer roundNumber);
}
