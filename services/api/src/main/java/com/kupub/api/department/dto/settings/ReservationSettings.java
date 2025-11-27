package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 예약 설정
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReservationSettings(
        /**
         * 시작 시간 (예: "18:00")
         */
        String startTime,

        /**
         * 종료 시간 (예: "00:30")
         * - 자정 이후면 다음날로 처리
         */
        String endTime,

        /**
         * 슬롯 간격 (분)
         */
        Integer intervalMinutes,

        /**
         * 이용 시간 (분)
         */
        Integer durationMinutes,

        /**
         * 최대 인원
         */
        Integer maxPeople,

        /**
         * 안내 문구
         */
        String notice
) {
    public static ReservationSettings defaults() {
        return new ReservationSettings(
                "18:00",
                "00:30",
                30,
                60,
                6,
                null
        );
    }
}

