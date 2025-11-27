package com.kupub.api.menu.dto;

import com.kupub.api.menu.entity.Menu;

public record MenuDto(
        Long id,
        Long categoryId,
        String name,
        Integer price,
        String description,
        String imageUrl,
        Integer displayOrder,
        Boolean soldOut
) {
    public static MenuDto from(Menu menu) {
        return new MenuDto(
                menu.getId(),
                menu.getCategoryId(),
                menu.getName(),
                menu.getPrice(),
                menu.getDescription(),
                menu.getImageUrl(),
                menu.getDisplayOrder(),
                menu.getSoldOut()
        );
    }
}
