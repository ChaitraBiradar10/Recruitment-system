package com.git.recruitment.repository;

import com.git.recruitment.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByRollNumber(String rollNumber);
    boolean existsByEmail(String email);
    boolean existsByRollNumber(String rollNumber);
    List<User> findByRegistrationStatusAndRole(User.RegistrationStatus s, User.Role r);
    List<User> findByRole(User.Role role);
    long countByRegistrationStatus(User.RegistrationStatus s);
    long countByApplicationStatus(User.ApplicationStatus s);
    long countByRole(User.Role r);
}
