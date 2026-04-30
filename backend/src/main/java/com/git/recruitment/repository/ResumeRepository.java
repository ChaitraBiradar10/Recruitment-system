package com.git.recruitment.repository;

import com.git.recruitment.model.Resume;
import com.git.recruitment.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findByUser(User user);
    Optional<Resume> findByUserId(Long userId);
    boolean existsByUser(User user);
}
