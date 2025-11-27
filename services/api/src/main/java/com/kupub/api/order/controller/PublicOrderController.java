package com.kupub.api.order.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.order.dto.OrderCreateRequest;
import com.kupub.api.order.dto.OrderDto;
import com.kupub.api.order.entity.Order;
import com.kupub.api.order.service.OrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{dept}/orders")
@CrossOrigin(origins = "*")
public class PublicOrderController {

    private static final Logger log = LoggerFactory.getLogger(PublicOrderController.class);

    private final OrderService orderService;
    private final DepartmentService departmentService;

    public PublicOrderController(OrderService orderService,
                                 DepartmentService departmentService) {
        this.orderService = orderService;
        this.departmentService = departmentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody OrderCreateRequest request) {

        log.debug("POST /api/{}/orders", deptSlug);

        Long deptId = departmentService.getActiveBySlug(deptSlug).getId();
        Order order = orderService.createOrder(deptId, deptSlug, request);

        log.info("Order created: dept={} orderId={} total={}", deptSlug, order.getId(), order.getTotalPrice());

        return ResponseEntity.ok(ApiResponse.ok(orderService.toOrderDto(order)));
    }

    /**
     * 주문 상태 조회 (Public) - 결제 확인 대기용
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrder(
            @PathVariable("dept") String deptSlug,
            @PathVariable("orderId") Long orderId) {

        log.debug("GET /api/{}/orders/{}", deptSlug, orderId);

        // 학과 확인
        Long deptId = departmentService.getActiveBySlug(deptSlug).getId();
        Order order = orderService.getOrder(orderId);

        // 해당 학과의 주문인지 확인
        if (!order.getDepartmentId().equals(deptId)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(ApiResponse.ok(orderService.toOrderDto(order)));
    }
}

