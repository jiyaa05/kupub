package com.kupub.api.department.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.entity.Department;
import com.kupub.api.department.entity.DepartmentSettings;
import com.kupub.api.department.repository.DepartmentSettingsRepository;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.department.service.DepartmentSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 관리자 설정 API
 */
@RestController
@RequestMapping("/api/{dept}/admin/settings")
@CrossOrigin(origins = "*")
public class AdminSettingsController {

    private static final Logger log = LoggerFactory.getLogger(AdminSettingsController.class);

    private final DepartmentService departmentService;
    private final DepartmentSettingsService settingsService;
    private final ObjectMapper objectMapper;

    public AdminSettingsController(DepartmentService departmentService,
                                   DepartmentSettingsService settingsService,
                                   ObjectMapper objectMapper) {
        this.departmentService = departmentService;
        this.settingsService = settingsService;
        this.objectMapper = objectMapper;
    }

    /**
     * 설정 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings(
            @PathVariable("dept") String deptSlug) {
        
        log.debug("GET /api/{}/admin/settings", deptSlug);
        
        Department dept = departmentService.getBySlug(deptSlug);
        Map<String, Object> settings = settingsService.getRawSettings(dept.getId());
        
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    /**
     * 설정 업데이트 (전체 교체)
     */
    @PatchMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(
            @PathVariable("dept") String deptSlug,
            @RequestBody Map<String, Object> newSettings) {
        
        log.info("PATCH /api/{}/admin/settings - keys: {}", deptSlug, newSettings.keySet());
        
        try {
            Department dept = departmentService.getBySlug(deptSlug);
            
            // 기존 updateSettings 메서드 사용 (이미 @Transactional이 적용되어 있음)
            DepartmentSettings saved = settingsService.updateSettings(dept.getId(), newSettings);
            
            log.info("Settings saved successfully: dept={}", deptSlug);
            
            // 저장된 데이터 반환
            Map<String, Object> result = settingsService.getRawSettings(dept.getId());
            return ResponseEntity.ok(ApiResponse.ok(result));
            
        } catch (Exception e) {
            log.error("Failed to save settings: dept={}", deptSlug, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("SAVE_FAILED", "설정 저장에 실패했습니다: " + e.getMessage()));
        }
    }
}
