package com.chrono.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpServiceDto {

    @NotBlank
    private String serviceName;

    @NotBlank
    private String secretKey;

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }
}
