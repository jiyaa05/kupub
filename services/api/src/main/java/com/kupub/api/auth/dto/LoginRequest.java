package com.kupub.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password,
        String departmentSlug,
        Long departmentId
) {}

