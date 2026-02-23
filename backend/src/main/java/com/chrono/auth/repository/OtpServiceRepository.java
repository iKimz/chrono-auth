package com.chrono.auth.repository;

import com.chrono.auth.entity.OtpService;
import com.chrono.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OtpServiceRepository extends JpaRepository<OtpService, Long> {
    List<OtpService> findByUser(User user);

    void deleteByIdAndUser(Long id, User user);
}
