package com.chrono.auth.controller;

import com.chrono.auth.dto.MessageResponse;
import com.chrono.auth.dto.OtpServiceDto;
import com.chrono.auth.entity.ActivityLog;
import com.chrono.auth.entity.OtpService;
import com.chrono.auth.entity.User;
import com.chrono.auth.repository.ActivityLogRepository;
import com.chrono.auth.repository.OtpServiceRepository;
import com.chrono.auth.repository.UserRepository;
import com.chrono.auth.utils.TotpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/otp")
public class OtpServiceController {

    @Autowired
    private OtpServiceRepository otpServiceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private User getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<?> getUserServices(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<OtpService> services;

        // Admins can see ALL services
        if ("ROLE_ADMIN".equals(user.getRole())) {
            services = otpServiceRepository.findAll();
        } else {
            services = otpServiceRepository.findByUser(user);
        }

        // Exclude secret key from response for security, but include owner for Admins
        List<Map<String, Object>> response = services.stream()
                .map(s -> Map.of(
                        "id", (Object) s.getId(),
                        "serviceName", s.getServiceName(),
                        "owner", s.getUser().getUsername(),
                        "createdAt", s.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> addService(@Valid @RequestBody OtpServiceDto dto, Authentication authentication) {
        if (!TotpUtils.isValidSecret(dto.getSecretKey())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid Base32 secret key"));
        }

        User user = getCurrentUser(authentication);
        OtpService service = new OtpService();
        service.setUser(user);
        service.setServiceName(dto.getServiceName());
        service.setSecretKey(dto.getSecretKey().replace(" ", "").toUpperCase());

        otpServiceRepository.save(service);
        activityLogRepository
                .save(new ActivityLog(user.getUsername(), "ADD_SERVICE", "Added OTP service: " + dto.getServiceName()));

        return ResponseEntity.ok(new MessageResponse("Service added successfully"));
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Optional<OtpService> serviceOpt = otpServiceRepository.findById(id);

        if (serviceOpt.isPresent() && serviceOpt.get().getUser().getId().equals(user.getId())) {
            otpServiceRepository.deleteByIdAndUser(id, user);
            activityLogRepository.save(new ActivityLog(user.getUsername(), "DELETE_SERVICE",
                    "Deleted OTP service: " + serviceOpt.get().getServiceName()));
            return ResponseEntity.ok(new MessageResponse("Service deleted"));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Service not found or unauthorized"));
    }

    @GetMapping("/{id}/token")
    public ResponseEntity<?> getOtpToken(@PathVariable Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Optional<OtpService> serviceOpt = otpServiceRepository.findById(id);

        if (serviceOpt.isPresent()) {
            OtpService service = serviceOpt.get();
            // Check authorization: Must be owner OR an Admin
            if (service.getUser().getId().equals(user.getId()) || "ROLE_ADMIN".equals(user.getRole())) {
                String code = TotpUtils.getTOTPCode(service.getSecretKey());

                // Log activity
                activityLogRepository.save(new ActivityLog(user.getUsername(), "VIEW_OTP", "Viewed OTP for service: "
                        + service.getServiceName() + " (Owner: " + service.getUser().getUsername() + ")"));

                return ResponseEntity.ok(Map.of("code", code, "serviceName", service.getServiceName()));
            }
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Service not found or unauthorized"));
    }
}
