package com.kupub.api.menu.dto;

public record CategoryUpdateRequest(
        String name,
        Integer displayOrder
) {}

