package com.kupub.api.session.dto;

import com.kupub.api.session.entity.SessionType;
import jakarta.validation.constraints.NotNull;

/**
 * 세션 시작 요청 DTO
 */
public record StartSessionRequest(
        @NotNull(message = "세션 타입은 필수입니다")
        SessionType type,

        /**
         * 예약 ID (RESERVATION 타입일 때)
         */
        Long reservationId,

        /**
         * 테이블 ID (QR 타입일 때)
         */
        Long tableId,

        /**
         * 세션 코드 (CODE 타입일 때)
         */
        String sessionCode,

        /**
         * 손님 이름 (예약 없이 진입 시)
         */
        String guestName,

        /**
         * 손님 연락처
         */
        String guestPhone,

        /**
         * 인원 수
         */
        Integer people
) {
}

