-- Create database if it doesn't exist (handled by docker-compose)
-- USE chrono_auth;

-- We don't necessarily need to create the tables manually if we use Hibernate ddl-auto=update in Spring Boot.
-- However, creating them here is good practice.

-- Drop tables if they exist
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS otp_services;
DROP TABLE IF EXISTS users;

-- Users table (optional if only using LDAP, but good for local/bypass mapping or role management)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP Services table
CREATE TABLE otp_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs table
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default user for testing
INSERT INTO users (username) VALUES ('testuser');
