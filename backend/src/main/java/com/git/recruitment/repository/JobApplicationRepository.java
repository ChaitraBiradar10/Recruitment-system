package com.git.recruitment.repository;

import com.git.recruitment.model.Job;
import com.git.recruitment.model.JobApplication;
import com.git.recruitment.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByUser(User user);
    List<JobApplication> findByJob(Job job);
    List<JobApplication> findByJobOrderByAppliedAtDesc(Job job);
    Optional<JobApplication> findByUserAndJob(User user, Job job);
    boolean existsByUserAndJob(User user, Job job);
    long countByJob(Job job);
    long countByStatus(JobApplication.AppStatus status);
    List<JobApplication> findByUserOrderByAppliedAtDesc(User user);
    @EntityGraph(attributePaths = {"job"})
    List<JobApplication> findByUserAndFinalSelectedTrueOrderByUpdatedAtDesc(User user);
    @EntityGraph(attributePaths = {"job"})
    List<JobApplication> findByUserAndStatusOrderByUpdatedAtDesc(User user, JobApplication.AppStatus status);

}
