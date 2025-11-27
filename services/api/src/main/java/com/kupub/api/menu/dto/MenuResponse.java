package com.kupub.api.menu.dto;

import java.util.List;

public record MenuResponse(
        DeptInfo department,
        List<MenuCategoryDto> categories,
        List<MenuDto> menus
) {
    public record DeptInfo(Long id, String slug, String name) {}
}

