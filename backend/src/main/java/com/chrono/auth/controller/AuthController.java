package com.chrono.auth.controller;

import com.chrono.auth.dto.LoginRequest;
import com.chrono.auth.dto.MessageResponse;
import com.chrono.auth.entity.ActivityLog;
import com.chrono.auth.entity.User;
import com.chrono.auth.repository.ActivityLogRepository;
import com.chrono.auth.repository.UserRepository;
import com.chrono.auth.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        @Autowired
        private AuthenticationManager authenticationManager;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private ActivityLogRepository activityLogRepository;

        @Autowired
        private JwtUtils jwtUtils;

        @PostMapping("/login")
        public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(),
                                                loginRequest.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Ensure user exists in our DB, check role
                String username = authentication.getName();
                User user = userRepository.findByUsername(username).orElseGet(() -> {
                        User newUser = new User(username);
                        return userRepository.save(newUser);
                });

                String jwt = jwtUtils.generateJwtToken(authentication.getName(), user.getRole());

                ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwt)
                                .path("/api")
                                .maxAge(24 * 60 * 60)
                                .httpOnly(true)
                                .build();

                activityLogRepository.save(new ActivityLog(username, "LOGIN", "User logged in successfully - Method: "
                                + (authentication.getAuthorities().isEmpty() ? "Bypass" : "LDAP")));

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                                .body(new MessageResponse("Login successful"));
        }

        @PostMapping("/logout")
        public ResponseEntity<?> logoutUser() {
                ResponseCookie cookie = ResponseCookie.from("jwt", null)
                                .path("/api")
                                .maxAge(0)
                                .httpOnly(true)
                                .build();
                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                                .body(new MessageResponse("You've been signed out!"));
        }
}
