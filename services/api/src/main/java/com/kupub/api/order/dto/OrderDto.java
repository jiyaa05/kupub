package com.kupub.api.order.dto;

import com.kupub.api.order.entity.Order;
import com.kupub.api.order.entity.OrderStatus;
import com.kupub.api.order.entity.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 주문 응답 DTO
 */
public record OrderDto(
        Long id,
        Long departmentId,
        Long sessionId,
        Long tableId,
        String tableCode,           // 조인해서 채움
        Long reservationId,
        Integer subtotal,
        Integer tableFee,
        Integer corkage,
        Integer discount,
        Integer totalPrice,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String note,
        List<OrderItemDto> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static OrderDto from(Order order, List<OrderItemDto> items) {
        return from(order, items, null);
    }

    public static OrderDto from(Order order, List<OrderItemDto> items, String tableCode) {
        return new OrderDto(
                order.getId(),
                order.getDepartmentId(),
                order.getSessionId(),
                order.getTableId(),
                tableCode,
                order.getReservationId(),
                order.getSubtotal(),
                order.getTableFee(),
                order.getCorkage(),
                order.getDiscount(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getNote(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}

