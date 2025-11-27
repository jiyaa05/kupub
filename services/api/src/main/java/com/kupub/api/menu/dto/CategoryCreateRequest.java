package com.kupub.api.menu.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryCreateRequest(
        @NotBlank String name,
        Integer displayOrder
) {}

