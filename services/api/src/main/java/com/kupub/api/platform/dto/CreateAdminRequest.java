package com.kupub.api.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAdminRequest(
        @NotNull(message = "departmentId는 필수입니다")
        Long departmentId,

        @NotBlank(message = "username은 필수입니다")
        @Size(min = 3, max = 30, message = "username은 3~30자여야 합니다")
        String username,

        @NotBlank(message = "password는 필수입니다")
        @Size(min = 6, message = "password는 최소 6자여야 합니다")
        String password
) {}

