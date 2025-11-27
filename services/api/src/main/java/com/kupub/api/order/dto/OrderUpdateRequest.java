package com.kupub.api.order.dto;

import com.kupub.api.order.entity.OrderStatus;
import com.kupub.api.order.entity.PaymentStatus;

/**
 * 주문 상태 변경 요청 DTO
 */
public record OrderUpdateRequest(
        OrderStatus status,
        PaymentStatus paymentStatus,
        String note
) {
}

