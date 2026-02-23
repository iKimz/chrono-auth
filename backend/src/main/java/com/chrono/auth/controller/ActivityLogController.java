package com.chrono.auth.controller;

import com.chrono.auth.entity.ActivityLog;
import com.chrono.auth.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public ResponseEntity<?> getLogs(Authentication authentication) {
        String username = authentication.getName();

        // Determine role to fetch all logs or just user logs
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<ActivityLog> logs;
        if (isAdmin) {
            logs = activityLogRepository.findAllByOrderByTimestampDesc();
        } else {
            logs = activityLogRepository.findByUsernameOrderByTimestampDesc(username);
        }

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllLogs() {
        // Admin or debugging endpoint
        return ResponseEntity.ok(activityLogRepository.findAllByOrderByTimestampDesc());
    }
}
