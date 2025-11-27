package com.kupub.api.order.entity;

/**
 * 주문 상태 (주방/서빙 기준)
 */
public enum OrderStatus {
    /**
     * 대기 중 (결제 대기 포함)
     */
    PENDING,

    /**
     * 준비 중 (조리 중)
     */
    PREPARING,

    /**
     * 완료 (서빙 완료)
     */
    DONE,

    /**
     * 취소됨
     */
    CANCELLED
}

