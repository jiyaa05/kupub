package com.kupub.api.menu.dto;

public record MenuUpdateRequest(
        Long categoryId,
        String name,
        Integer price,
        String description,
        String imageUrl,
        Integer displayOrder,
        Boolean soldOut
) {}

