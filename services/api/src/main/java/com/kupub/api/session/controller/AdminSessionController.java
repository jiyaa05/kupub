package com.kupub.api.session.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.order.entity.Order;
import com.kupub.api.order.repository.OrderRepository;
import com.kupub.api.order.repository.OrderItemRepository;
import com.kupub.api.session.dto.AssignTableRequest;
import com.kupub.api.session.dto.SessionDto;
import com.kupub.api.session.entity.GuestSession;
import com.kupub.api.session.service.SessionService;
import com.kupub.api.table.entity.DepartmentTable;
import com.kupub.api.table.service.TableService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 세션 관리 API (관리자용)
 */
@RestController
@RequestMapping("/api/{dept}/admin/sessions")
@CrossOrigin(origins = "*")
public class AdminSessionController {

    private static final Logger log = LoggerFactory.getLogger(AdminSessionController.class);

    private final SessionService sessionService;
    private final TableService tableService;
    private final DepartmentService departmentService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public AdminSessionController(SessionService sessionService,
                                  TableService tableService,
                                  DepartmentService departmentService,
                                  OrderRepository orderRepository,
                                  OrderItemRepository orderItemRepository) {
        this.sessionService = sessionService;
        this.tableService = tableService;
        this.departmentService = departmentService;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    /**
     * 활성 세션 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionDto>>> getActiveSessions(
            @PathVariable("dept") String deptSlug,
            @RequestParam(value = "all", defaultValue = "false") boolean includeAll) {

        log.debug("GET /api/{}/admin/sessions all={}", deptSlug, includeAll);

        Long deptId = departmentService.getBySlug(deptSlug).getId();

        List<GuestSession> sessions = includeAll
                ? sessionService.getAllSessions(deptId)
                : sessionService.getActiveSessions(deptId);

        List<SessionDto> dtos = sessions.stream()
                .map(session -> {
                    String tableCode = null;
                    if (session.getTableId() != null) {
                        try {
                            DepartmentTable table = tableService.getTable(session.getTableId());
                            tableCode = table.getCode();
                        } catch (Exception ignored) {
                        }
                    }
                    return SessionDto.from(session, tableCode);
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    /**
     * 테이블 배정
     */
    @PatchMapping("/{id}/assign-table")
    @Transactional
    public ResponseEntity<ApiResponse<SessionDto>> assignTable(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long sessionId,
            @Valid @RequestBody AssignTableRequest request) {

        log.debug("PATCH /api/{}/admin/sessions/{}/assign-table tableId={}",
                deptSlug, sessionId, request.tableId());

        Long deptId = departmentService.getBySlug(deptSlug).getId();
        GuestSession session = sessionService.assignTable(deptId, sessionId, request.tableId());

        String tableCode = null;
        if (session.getTableId() != null) {
            try {
                DepartmentTable table = tableService.getTable(session.getTableId());
                tableCode = table.getCode();
            } catch (Exception ignored) {}
        }

        // 해당 세션의 모든 주문에도 테이블 ID 업데이트
        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        for (Order order : orders) {
            if (order.getTableId() == null || !order.getTableId().equals(request.tableId())) {
                order.setTableId(request.tableId());
                orderRepository.save(order);
                log.debug("Updated order {} with tableId {}", order.getId(), request.tableId());
            }
        }

        log.info("Table assigned: dept={} sessionId={} tableCode={} ordersUpdated={}",
                deptSlug, sessionId, tableCode, orders.size());

        return ResponseEntity.ok(ApiResponse.ok(SessionDto.from(session, tableCode)));
    }

    /**
     * 세션 종료
     */
    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<SessionDto>> closeSession(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long sessionId) {

        log.debug("PATCH /api/{}/admin/sessions/{}/close", deptSlug, sessionId);

        Long deptId = departmentService.getBySlug(deptSlug).getId();
        GuestSession session = sessionService.closeSession(deptId, sessionId);

        String tableCode = null;
        if (session.getTableId() != null) {
            try {
                DepartmentTable table = tableService.getTable(session.getTableId());
                tableCode = table.getCode();
            } catch (Exception ignored) {
            }
        }

        log.info("Session closed: dept={} sessionId={}", deptSlug, sessionId);

        return ResponseEntity.ok(ApiResponse.ok(SessionDto.from(session, tableCode)));
    }

    /**
     * 세션 재오픈 (퇴장 취소)
     */
    @PatchMapping("/{id}/reopen")
    public ResponseEntity<ApiResponse<SessionDto>> reopenSession(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long sessionId) {

        log.debug("PATCH /api/{}/admin/sessions/{}/reopen", deptSlug, sessionId);

        Long deptId = departmentService.getBySlug(deptSlug).getId();
        GuestSession session = sessionService.reopenSession(deptId, sessionId);

        String tableCode = null;
        if (session.getTableId() != null) {
            try {
                DepartmentTable table = tableService.getTable(session.getTableId());
                tableCode = table.getCode();
            } catch (Exception ignored) {
            }
        }

        log.info("Session reopened: dept={} sessionId={}", deptSlug, sessionId);

        return ResponseEntity.ok(ApiResponse.ok(SessionDto.from(session, tableCode)));
    }

    /**
     * 세션 삭제 (주문 포함)
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long sessionId) {

        log.debug("DELETE /api/{}/admin/sessions/{}", deptSlug, sessionId);

        Long deptId = departmentService.getBySlug(deptSlug).getId();

        // 주문 + 주문 아이템 삭제 후 세션 삭제
        List<Order> orders = orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        orders.forEach(order -> orderItemRepository.deleteByOrderId(order.getId()));
        orderRepository.deleteBySessionId(sessionId);
        sessionService.deleteSession(deptId, sessionId);

        log.info("Session deleted: dept={} sessionId={}", deptSlug, sessionId);

        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
