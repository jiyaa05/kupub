package com.kupub.api.notification;

import com.kupub.api.department.dto.settings.DepartmentSettingsDto;
import com.kupub.api.department.dto.settings.SmsSettings;
import com.kupub.api.department.service.DepartmentSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * SMS 전송 서비스
 * 
 * 각 학과별로 알리고 설정을 관리합니다.
 * 학과 관리자가 자신의 알리고 계정을 설정하면 해당 계정으로 SMS가 발송됩니다.
 * 
 * 알리고 (https://smartsms.aligo.in) - 건당 약 8.4원
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final DepartmentSettingsService settingsService;

    public SmsService(DepartmentSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    /**
     * 학과별 설정으로 SMS 전송
     * 
     * @param departmentId 학과 ID
     * @param phoneNumber 수신자 전화번호 (예: 01012345678)
     * @param message 메시지 내용 (90바이트 초과 시 LMS로 전송)
     * @return 성공 여부
     */
    public boolean sendSms(Long departmentId, String phoneNumber, String message) {
        // 학과별 SMS 설정 조회
        DepartmentSettingsDto settings = settingsService.getSettingsDto(departmentId);
        SmsSettings smsSettings = settings.sms();
        
        if (smsSettings == null) {
            smsSettings = SmsSettings.defaults();
        }

        if (!smsSettings.isConfigured()) {
            log.info("SMS not configured for department {}. Would send to {}: {}", 
                    departmentId, phoneNumber, message);
            return true; // 설정 안 되어 있으면 로그만 남기고 성공 처리
        }

        // 전화번호 정규화
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        if (normalizedPhone == null) {
            log.error("Invalid phone number: {}", phoneNumber);
            return false;
        }

        try {
            return sendViaAligo(normalizedPhone, message, smsSettings);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }

    /**
     * 알리고 API를 통한 SMS 전송
     */
    private boolean sendViaAligo(String phoneNumber, String message, SmsSettings settings) throws Exception {
        String apiUrl = "https://apis.aligo.in/send/";
        
        // 메시지 길이에 따라 SMS/LMS 결정
        String msgType = message.getBytes(StandardCharsets.UTF_8).length > 90 ? "LMS" : "SMS";

        String params = String.format(
            "key=%s&user_id=%s&sender=%s&receiver=%s&msg=%s&msg_type=%s",
            settings.aligoApiKey(), 
            settings.aligoUserId(), 
            settings.senderNumber(), 
            phoneNumber,
            java.net.URLEncoder.encode(message, StandardCharsets.UTF_8), 
            msgType
        );

        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

        try (OutputStream os = conn.getOutputStream()) {
            os.write(params.getBytes(StandardCharsets.UTF_8));
        }

        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            log.info("SMS sent successfully to {} via dept settings", phoneNumber);
            return true;
        } else {
            log.error("SMS failed with response code: {}", responseCode);
            return false;
        }
    }

    /**
     * 전화번호 정규화
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return null;
        
        // 숫자만 추출
        String digits = phoneNumber.replaceAll("[^0-9]", "");
        
        // 한국 전화번호 형식 확인
        if (digits.startsWith("82")) {
            digits = "0" + digits.substring(2);
        }
        
        if (digits.length() < 10 || digits.length() > 11) {
            return null;
        }
        
        return digits;
    }

    /**
     * 해당 학과의 SMS 설정 여부 확인
     */
    public boolean isConfigured(Long departmentId) {
        DepartmentSettingsDto settings = settingsService.getSettingsDto(departmentId);
        SmsSettings smsSettings = settings.sms();
        return smsSettings != null && smsSettings.isConfigured();
    }
}

