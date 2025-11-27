package com.kupub.api.department.dto.settings;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * SMS 설정
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SmsSettings(
        Boolean enabled,
        String provider,
        String aligoApiKey,
        String aligoUserId,
        String senderNumber
) {
    public static SmsSettings defaults() {
        return new SmsSettings(false, "aligo", "", "", "");
    }

    public boolean isConfigured() {
        return enabled != null && enabled
                && aligoApiKey != null && !aligoApiKey.isBlank()
                && aligoUserId != null && !aligoUserId.isBlank()
                && senderNumber != null && !senderNumber.isBlank();
    }
}

