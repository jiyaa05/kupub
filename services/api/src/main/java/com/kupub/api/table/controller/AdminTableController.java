package com.kupub.api.table.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.table.dto.*;
import com.kupub.api.table.entity.DepartmentTable;
import com.kupub.api.table.service.TableService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 테이블 관리 API (관리자용)
 */
@RestController
@RequestMapping("/api/{dept}/admin/tables")
@CrossOrigin(origins = "*")
public class AdminTableController {

    private static final Logger log = LoggerFactory.getLogger(AdminTableController.class);

    private final TableService tableService;
    private final DepartmentService departmentService;

    public AdminTableController(TableService tableService, DepartmentService departmentService) {
        this.tableService = tableService;
        this.departmentService = departmentService;
    }

    /**
     * 테이블 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TableDto>>> getTables(
            @PathVariable("dept") String deptSlug) {
        
        log.debug("GET /api/{}/admin/tables", deptSlug);
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        List<TableDto> tables = tableService.getTablesByDepartment(deptId)
                .stream()
                .map(TableDto::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(tables));
    }

    /**
     * 테이블 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TableDto>> createTable(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody TableCreateRequest request) {
        
        log.debug("POST /api/{}/admin/tables code={}", deptSlug, request.code());
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        DepartmentTable table = tableService.createTable(deptId, request);

        log.info("Table created: dept={} id={} code={}", deptSlug, table.getId(), table.getCode());

        return ResponseEntity.ok(ApiResponse.ok(TableDto.from(table)));
    }

    /**
     * 테이블 수정
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<TableDto>> updateTable(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long tableId,
            @Valid @RequestBody TableUpdateRequest request) {
        
        log.debug("PATCH /api/{}/admin/tables/{}", deptSlug, tableId);
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        DepartmentTable table = tableService.updateTable(deptId, tableId, request);

        log.info("Table updated: dept={} id={}", deptSlug, tableId);

        return ResponseEntity.ok(ApiResponse.ok(TableDto.from(table)));
    }

    /**
     * 테이블 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTable(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long tableId) {
        
        log.debug("DELETE /api/{}/admin/tables/{}", deptSlug, tableId);
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        tableService.deleteTable(deptId, tableId);

        log.info("Table deleted: dept={} id={}", deptSlug, tableId);

        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * 레이아웃 일괄 저장
     */
    @PutMapping("/layout")
    public ResponseEntity<ApiResponse<List<TableDto>>> updateLayout(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody TableLayoutRequest request) {
        
        log.debug("PUT /api/{}/admin/tables/layout count={}", deptSlug, request.tables().size());
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        List<TableDto> tables = tableService.updateLayout(deptId, request)
                .stream()
                .map(TableDto::from)
                .toList();

        log.info("Table layout updated: dept={}", deptSlug);

        return ResponseEntity.ok(ApiResponse.ok(tables));
    }
}

