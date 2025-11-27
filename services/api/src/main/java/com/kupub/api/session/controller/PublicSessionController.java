package com.kupub.api.session.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.session.dto.SessionDto;
import com.kupub.api.session.dto.StartSessionRequest;
import com.kupub.api.session.entity.GuestSession;
import com.kupub.api.session.service.SessionService;
import com.kupub.api.table.entity.DepartmentTable;
import com.kupub.api.table.service.TableService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 세션 API (Public)
 */
@RestController
@RequestMapping("/api/{dept}/sessions")
@CrossOrigin(origins = "*")
public class PublicSessionController {

    private static final Logger log = LoggerFactory.getLogger(PublicSessionController.class);

    private final SessionService sessionService;
    private final TableService tableService;
    private final DepartmentService departmentService;

    public PublicSessionController(SessionService sessionService,
                                   TableService tableService,
                                   DepartmentService departmentService) {
        this.sessionService = sessionService;
        this.tableService = tableService;
        this.departmentService = departmentService;
    }

    /**
     * 세션 시작
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<SessionDto>> startSession(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody StartSessionRequest request) {

        log.debug("POST /api/{}/sessions/start type={}", deptSlug, request.type());

        Long deptId = departmentService.getActiveBySlug(deptSlug).getId();
        GuestSession session = sessionService.startSession(deptId, request);

        String tableCode = null;
        if (session.getTableId() != null) {
            DepartmentTable table = tableService.getTable(session.getTableId());
            tableCode = table.getCode();
        }

        log.info("Session started: dept={} id={} type={}", deptSlug, session.getId(), session.getType());

        return ResponseEntity.ok(ApiResponse.ok(SessionDto.from(session, tableCode)));
    }

    /**
     * 세션 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SessionDto>> getSession(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long sessionId) {

        log.debug("GET /api/{}/sessions/{}", deptSlug, sessionId);

        // 비활성 학과 차단
        departmentService.getActiveBySlug(deptSlug);

        GuestSession session = sessionService.getSession(sessionId);

        String tableCode = null;
        if (session.getTableId() != null) {
            DepartmentTable table = tableService.getTable(session.getTableId());
            tableCode = table.getCode();
        }

        return ResponseEntity.ok(ApiResponse.ok(SessionDto.from(session, tableCode)));
    }

    /**
     * 세션 코드로 조회
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<SessionDto>> getSessionByCode(
            @PathVariable("dept") String deptSlug,
            @PathVariable("code") String code) {

        log.debug("GET /api/{}/sessions/code/{}", deptSlug, code);

        Long deptId = departmentService.getActiveBySlug(deptSlug).getId();
        GuestSession session = sessionService.getSessionByCode(deptId, code);

        String tableCode = null;
        if (session.getTableId() != null) {
            DepartmentTable table = tableService.getTable(session.getTableId());
            tableCode = table.getCode();
        }

        return ResponseEntity.ok(ApiResponse.ok(SessionDto.from(session, tableCode)));
    }
}

