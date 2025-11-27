package com.kupub.api.menu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MenuCreateRequest(
        Long categoryId,
        @NotBlank String name,
        @NotNull @Positive Integer price,
        String description,
        String imageUrl,
        Integer displayOrder
) {}

