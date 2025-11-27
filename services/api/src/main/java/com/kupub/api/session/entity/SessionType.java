package com.kupub.api.session.entity;

/**
 * 세션 타입
 */
public enum SessionType {
    /**
     * 예약을 통한 진입
     */
    RESERVATION,

    /**
     * QR 스캔을 통한 진입
     */
    QR,

    /**
     * 코드 입력을 통한 진입
     */
    CODE
}

