package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 브랜딩 설정
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BrandingSettings(
        String primaryColor,
        String logoUrl,
        String backgroundUrl
) {
    public static BrandingSettings defaults() {
        return new BrandingSettings("#E3A94B", null, null);
    }
}

