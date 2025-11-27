package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 결제 설정
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaymentSettings(
        /**
         * 결제 방식
         * - "transfer": 계좌이체
         * - "cash": 현금
         * - "none": 결제 없음
         */
        String method,

        /**
         * 은행명
         */
        String bankName,

        /**
         * 계좌번호
         */
        String accountNumber,

        /**
         * 예금주
         */
        String accountHolder,

        /**
         * 안내 문구
         */
        String notice
) {
    public static PaymentSettings defaults() {
        return new PaymentSettings(
                "transfer",
                "",
                "",
                "",
                null
        );
    }
}

