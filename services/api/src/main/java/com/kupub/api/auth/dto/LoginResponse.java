package com.kupub.api.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String username,
        Long departmentId,
        String departmentSlug,
        String role
) {}

