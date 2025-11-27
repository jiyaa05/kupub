package com.kupub.api.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 주문 아이템 요청 DTO
 */
public record OrderItemRequest(
        /**
         * 메뉴 ID (있으면 메뉴에서 이름/가격 가져옴)
         */
        Long menuId,

        /**
         * 메뉴 이름 (menuId 없을 때 필수)
         */
        String name,

        /**
         * 가격 (menuId 없을 때 필수)
         */
        Integer price,

        /**
         * 수량
         */
        @NotNull(message = "수량은 필수입니다")
        @Min(value = 1, message = "수량은 1 이상이어야 합니다")
        Integer quantity
) {
}

