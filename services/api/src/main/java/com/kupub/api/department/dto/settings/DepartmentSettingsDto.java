package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 학과 설정 DTO (타입 안정성 보장)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DepartmentSettingsDto(
        BrandingSettings branding,
        FlowSettings flow,
        ReservationSettings reservation,
        PaymentSettings payment,
        PricingSettings pricing,
        SmsSettings sms,
        List<OnboardingSlide> onboarding,
        List<String> reservationClosed
) {
    /**
     * 기본값으로 생성
     */
    public static DepartmentSettingsDto defaults() {
        return new DepartmentSettingsDto(
                BrandingSettings.defaults(),
                FlowSettings.defaults(),
                ReservationSettings.defaults(),
                PaymentSettings.defaults(),
                PricingSettings.defaults(),
                SmsSettings.defaults(),
                OnboardingSlide.defaults(),
                List.of()
        );
    }
}

