package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 가격 정책 설정
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PricingSettings(
        /**
         * 테이블비 (원)
         */
        Integer tableFee,

        /**
         * 콜키지 (원)
         */
        Integer corkage,

        /**
         * 할인 목록
         */
        List<DiscountLine> discounts
) {
    public static PricingSettings defaults() {
        return new PricingSettings(0, 0, List.of());
    }

    /**
     * 할인 항목
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DiscountLine(
            String label,
            Integer amount,  // 음수면 할인
            String condition // 조건 (선택)
    ) {
    }
}

