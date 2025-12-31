package com.plyst.domain.auth.repository;

import com.plyst.domain.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    Optional<EmailVerification> findByEmailAndCodeAndVerifiedAtIsNull(String email, String code);
    Optional<EmailVerification> findTopByEmailOrderByCreatedAtDesc(String email);
}
