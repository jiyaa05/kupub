package com.kupub.api.order.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.notification.ReceiptService;
import com.kupub.api.order.dto.OrderDto;
import com.kupub.api.order.dto.OrderUpdateRequest;
import com.kupub.api.order.entity.Order;
import com.kupub.api.order.entity.OrderItem;
import com.kupub.api.order.entity.OrderStatus;
import com.kupub.api.order.service.OrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/{dept}/admin/orders")
@CrossOrigin(origins = "*")
public class AdminOrderController {

    private static final Logger log = LoggerFactory.getLogger(AdminOrderController.class);

    private final OrderService orderService;
    private final DepartmentService departmentService;
    private final ReceiptService receiptService;

    public AdminOrderController(OrderService orderService,
                                DepartmentService departmentService,
                                ReceiptService receiptService) {
        this.orderService = orderService;
        this.departmentService = departmentService;
        this.receiptService = receiptService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDto>>> getOrders(
            @PathVariable("dept") String deptSlug,
            @RequestParam(value = "status", required = false) OrderStatus status) {

        log.debug("GET /api/{}/admin/orders status={}", deptSlug, status);

        Long deptId = departmentService.getBySlug(deptSlug).getId();
        
        List<Order> orders = status != null
                ? orderService.getOrdersByStatus(deptId, status)
                : orderService.getOrdersByDepartment(deptId);

        List<OrderDto> dtos = orderService.toOrderDtos(orders);

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrder(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long orderId) {

        Long deptId = departmentService.getBySlug(deptSlug).getId();
        Order order = orderService.getOrderForDepartment(deptId, orderId);
        OrderDto dto = orderService.toOrderDto(order);

        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrder(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long orderId,
            @Valid @RequestBody OrderUpdateRequest request) {

        log.debug("PATCH /api/{}/admin/orders/{}", deptSlug, orderId);

        Long deptId = departmentService.getBySlug(deptSlug).getId();
        Order order = orderService.getOrderForDepartment(deptId, orderId);

        if (request.status() != null) {
            order = orderService.updateStatus(orderId, request.status(), deptSlug);
        }
        if (request.paymentStatus() != null) {
            order = orderService.updatePaymentStatus(orderId, request.paymentStatus(), deptSlug);
        }

        log.info("Order updated: dept={} orderId={} status={} paymentStatus={}",
                deptSlug, orderId, order.getStatus(), order.getPaymentStatus());

        return ResponseEntity.ok(ApiResponse.ok(orderService.toOrderDto(order)));
    }

    /**
     * 영수증 전송
     */
    @PostMapping("/{id}/send-receipt")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> sendReceipt(
            @PathVariable("dept") String deptSlug,
            @PathVariable("id") Long orderId,
            @RequestBody Map<String, String> request) {

        log.debug("POST /api/{}/admin/orders/{}/send-receipt", deptSlug, orderId);

        Long deptId = departmentService.getBySlug(deptSlug).getId();

        String phoneNumber = request.get("phoneNumber");
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_PHONE", "전화번호를 입력해주세요."));
        }

        Order order = orderService.getOrderForDepartment(deptId, orderId);
        List<OrderItem> items = orderService.getOrderItems(orderId);

        boolean sent = receiptService.sendPaymentConfirmation(order, phoneNumber);

        log.info("Receipt sent: orderId={} phone={} success={}", orderId, phoneNumber, sent);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("sent", sent)));
    }
}

