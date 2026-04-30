package com.git.recruitment.repository;

import com.git.recruitment.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByStatusOrderByCreatedAtDesc(Job.JobStatus status);
    List<Job> findAllByOrderByCreatedAtDesc();
    long countByStatus(Job.JobStatus status);
}
