package com.kupub.api.department.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.dto.DepartmentDto;
import com.kupub.api.department.entity.Department;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.department.service.DepartmentSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/{dept}/settings")
@CrossOrigin(origins = "*")
public class PublicSettingsController {

    private final DepartmentService departmentService;
    private final DepartmentSettingsService settingsService;

    public PublicSettingsController(DepartmentService departmentService,
                                    DepartmentSettingsService settingsService) {
        this.departmentService = departmentService;
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SettingsResponse>> getSettings(@PathVariable("dept") String deptSlug) {
        Department dept = departmentService.getActiveBySlug(deptSlug);
        Map<String, Object> settings = settingsService.getRawSettings(dept.getId());
        
        return ResponseEntity.ok(ApiResponse.ok(new SettingsResponse(
                DepartmentDto.from(dept),
                settings
        )));
    }

    public record SettingsResponse(DepartmentDto department, Map<String, Object> settings) {}
}

