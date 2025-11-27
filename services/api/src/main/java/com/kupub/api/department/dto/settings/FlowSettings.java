package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 플로우 설정 (커스터마이징 핵심)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FlowSettings(
        /**
         * 허용되는 진입 방식
         * - "reservation": 예약하기
         * - "qr": QR 스캔
         * - "code": 코드 입력
         */
        List<String> entryModes,

        /**
         * 온보딩 슬라이드 표시 여부
         */
        Boolean showOnboarding,

        /**
         * 첫 주문 시 예약 필수 여부
         */
        Boolean requireReservationForFirstOrder,

        /**
         * 추가 주문 허용 여부
         */
        Boolean allowAdditionalOrder,

        /**
         * 결제 페이지 표시 여부
         */
        Boolean showPaymentPage
) {
    public static FlowSettings defaults() {
        return new FlowSettings(
                List.of("reservation"),  // 기본: 예약만
                true,                     // 온보딩 표시
                true,                     // 첫 주문은 예약 필수
                true,                     // 추가 주문 허용
                true                      // 결제 페이지 표시
        );
    }
}

