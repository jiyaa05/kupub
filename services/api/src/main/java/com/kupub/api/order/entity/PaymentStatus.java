package com.kupub.api.order.entity;

/**
 * 결제 상태
 */
public enum PaymentStatus {
    /**
     * 결제 대기 중
     */
    PENDING,

    /**
     * 결제 확인됨
     */
    CONFIRMED,

    /**
     * 결제 실패/취소
     */
    FAILED,

    /**
     * 결제 불필요 (현금 후불 등)
     */
    NOT_REQUIRED
}

