package com.kupub.api.menu.dto;

import com.kupub.api.menu.entity.MenuCategory;

public record CategoryDto(
        Long id,
        String name,
        Integer displayOrder
) {
    public static CategoryDto from(MenuCategory category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDisplayOrder()
        );
    }
}

