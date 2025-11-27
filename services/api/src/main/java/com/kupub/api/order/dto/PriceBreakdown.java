package com.kupub.api.order.dto;

/**
 * 가격 내역 DTO
 */
public record PriceBreakdown(
        Integer subtotal,      // 메뉴 소계
        Integer tableFee,      // 테이블비
        Integer corkage,       // 콜키지
        Integer discount,      // 할인 (음수)
        Integer total          // 총액
) {
}

