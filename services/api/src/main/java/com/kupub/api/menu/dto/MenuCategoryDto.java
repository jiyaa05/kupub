package com.kupub.api.menu.dto;

import com.kupub.api.menu.entity.MenuCategory;

public record MenuCategoryDto(Long id, String name, Integer displayOrder) {
    public static MenuCategoryDto from(MenuCategory c) {
        return new MenuCategoryDto(c.getId(), c.getName(), c.getDisplayOrder());
    }
}

