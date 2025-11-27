package com.kupub.api.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 주문 생성 요청 DTO
 */
public record OrderCreateRequest(
        /**
         * 세션 ID (선택)
         */
        Long sessionId,

        /**
         * 테이블비 포함 여부 (선택, 기본 true; 추가 주문 시 무시됨)
         */
        Boolean includeTableFee,

        /**
         * 예약 ID (선택, 하위 호환)
         */
        Long reservationId,

        /**
         * 손님 메모
         */
        String note,

        /**
         * 할인 코드 (선택)
         */
        String discountCode,

        /**
         * 손님 전화번호 (SMS 발송용, 선택)
         */
        String guestPhone,

        /**
         * 주문 아이템 목록
         */
        @NotEmpty(message = "주문 아이템은 필수입니다")
        @Valid
        List<OrderItemRequest> items
) {
}

