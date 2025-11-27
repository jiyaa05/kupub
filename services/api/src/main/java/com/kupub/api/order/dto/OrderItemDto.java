package com.kupub.api.order.dto;

import com.kupub.api.order.entity.OrderItem;

/**
 * 주문 아이템 응답 DTO
 */
public record OrderItemDto(
        Long id,
        Long orderId,
        Long menuId,
        String name,
        Integer price,
        Integer quantity,
        Integer subtotal
) {
    public static OrderItemDto from(OrderItem item) {
        return new OrderItemDto(
                item.getId(),
                item.getOrderId(),
                item.getMenuId(),
                item.getName(),
                item.getPrice(),
                item.getQuantity(),
                item.getSubtotal()
        );
    }
}

