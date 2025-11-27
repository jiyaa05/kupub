package com.kupub.api.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateDepartmentRequest(
        @NotBlank(message = "slug는 필수입니다")
        @Size(min = 2, max = 20, message = "slug는 2~20자여야 합니다")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "slug는 영문 소문자, 숫자, 하이픈만 가능합니다")
        String slug,

        @NotBlank(message = "이름은 필수입니다")
        @Size(min = 1, max = 50, message = "이름은 1~50자여야 합니다")
        String name
) {}

