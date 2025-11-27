package com.kupub.api.department.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.department.dto.settings.DepartmentSettingsDto;
import com.kupub.api.department.entity.DepartmentSettings;
import com.kupub.api.department.repository.DepartmentSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DepartmentSettingsService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentSettingsService.class);

    private final DepartmentSettingsRepository settingsRepository;
    private final ObjectMapper objectMapper;

    public DepartmentSettingsService(DepartmentSettingsRepository settingsRepository,
                                     ObjectMapper objectMapper) {
        this.settingsRepository = settingsRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * 설정 조회 (없으면 생성)
     */
    @Transactional
    public DepartmentSettings getOrCreate(Long departmentId) {
        return settingsRepository.findByDepartmentId(departmentId)
                .orElseGet(() -> createDefault(departmentId));
    }

    /**
     * 설정 DTO로 조회
     */
    public DepartmentSettingsDto getSettingsDto(Long departmentId) {
        DepartmentSettings settings = getOrCreate(departmentId);
        return parseSettings(settings.getDataJson());
    }

    /**
     * Raw JSON 조회
     */
    public Map<String, Object> getRawSettings(Long departmentId) {
        DepartmentSettings settings = getOrCreate(departmentId);
        try {
            return objectMapper.readValue(settings.getDataJson(), Map.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse settings JSON: departmentId={}", departmentId, e);
            return Map.of();
        }
    }

    /**
     * 설정 업데이트 (전체 교체)
     */
    @Transactional
    public DepartmentSettings updateSettings(Long departmentId, Map<String, Object> newSettings) {
        DepartmentSettings settings = getOrCreate(departmentId);

        try {
            // 전체 설정을 새로운 값으로 교체
            String newJson = objectMapper.writeValueAsString(newSettings);
            settings.setDataJson(newJson);
            return settingsRepository.save(settings);

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize settings", e);
            throw new BadRequestException("INVALID_JSON", "설정 JSON 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * reservationClosed 배열에 슬롯 추가
     */
    @Transactional
    public void closeSlot(Long departmentId, String slot) {
        DepartmentSettings settings = getOrCreate(departmentId);
        try {
            Map<String, Object> data = objectMapper.readValue(settings.getDataJson(), Map.class);
            java.util.List<String> closed = (java.util.List<String>) data.get("reservationClosed");
            if (closed == null) {
                closed = new java.util.ArrayList<>();
            }
            if (!closed.contains(slot)) {
                closed.add(slot);
            }
            data.put("reservationClosed", closed);
            settings.setDataJson(objectMapper.writeValueAsString(data));
            settingsRepository.save(settings);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("INVALID_JSON", "설정 처리 중 오류");
        }
    }

    /**
     * reservationClosed 배열에서 슬롯 제거
     */
    @Transactional
    public void openSlot(Long departmentId, String slot) {
        DepartmentSettings settings = getOrCreate(departmentId);
        try {
            Map<String, Object> data = objectMapper.readValue(settings.getDataJson(), Map.class);
            java.util.List<String> closed = (java.util.List<String>) data.get("reservationClosed");
            if (closed != null) {
                closed.remove(slot);
                data.put("reservationClosed", closed);
                settings.setDataJson(objectMapper.writeValueAsString(data));
                settingsRepository.save(settings);
            }
        } catch (JsonProcessingException e) {
            throw new BadRequestException("INVALID_JSON", "설정 처리 중 오류");
        }
    }

    // ========== Private Methods ==========

    private DepartmentSettings createDefault(Long departmentId) {
        DepartmentSettings settings = new DepartmentSettings();
        settings.setDepartmentId(departmentId);

        try {
            DepartmentSettingsDto defaults = DepartmentSettingsDto.defaults();
            settings.setDataJson(objectMapper.writeValueAsString(defaults));
        } catch (JsonProcessingException e) {
            settings.setDataJson("{}");
        }

        return settingsRepository.save(settings);
    }

    private DepartmentSettingsDto parseSettings(String json) {
        if (json == null || json.isBlank()) {
            return DepartmentSettingsDto.defaults();
        }
        try {
            return objectMapper.readValue(json, DepartmentSettingsDto.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse settings, returning defaults", e);
            return DepartmentSettingsDto.defaults();
        }
    }
}

