package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 온보딩 슬라이드
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OnboardingSlide(
        String id,
        Boolean enabled,    // 슬라이드 활성화 여부
        String imageUrl,
        String title,
        String body,
        Integer order,
        String ctaText  // CTA 버튼 텍스트 (선택)
) {
    /**
     * 기본 슬라이드 3개 생성
     */
    public static java.util.List<OnboardingSlide> defaults() {
        return java.util.List.of(
            new OnboardingSlide("slide1", true, null, "환영합니다!", "즐거운 시간 보내세요", 1, null),
            new OnboardingSlide("slide2", true, null, "메뉴 주문", "원하는 메뉴를 골라 주문하세요", 2, null),
            new OnboardingSlide("slide3", true, null, "결제 안내", "계좌이체로 결제해주세요", 3, null)
        );
    }
}

