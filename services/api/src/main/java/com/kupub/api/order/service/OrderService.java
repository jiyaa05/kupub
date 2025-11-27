package com.kupub.api.order.service;

import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.menu.entity.Menu;
import com.kupub.api.menu.repository.MenuRepository;
import com.kupub.api.notification.NotificationService;
import com.kupub.api.notification.ReceiptService;
import com.kupub.api.order.dto.OrderDto;
import com.kupub.api.order.dto.OrderCreateRequest;
import com.kupub.api.order.dto.OrderItemRequest;
import com.kupub.api.order.dto.OrderItemDto;
import com.kupub.api.order.dto.PriceBreakdown;
import com.kupub.api.order.entity.*;
import com.kupub.api.order.repository.OrderItemRepository;
import com.kupub.api.order.repository.OrderRepository;
import com.kupub.api.reservation.entity.Reservation;
import com.kupub.api.reservation.repository.ReservationRepository;
import com.kupub.api.session.entity.GuestSession;
import com.kupub.api.session.service.SessionService;
import com.kupub.api.table.entity.DepartmentTable;
import com.kupub.api.table.service.TableService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuRepository menuRepository;
    private final PricingService pricingService;
    private final SessionService sessionService;
    private final NotificationService notificationService;
    private final ReceiptService receiptService;
    private final ReservationRepository reservationRepository;
    private final TableService tableService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        MenuRepository menuRepository,
                        PricingService pricingService,
                        SessionService sessionService,
                        NotificationService notificationService,
                        ReceiptService receiptService,
                        ReservationRepository reservationRepository,
                        TableService tableService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuRepository = menuRepository;
        this.pricingService = pricingService;
        this.sessionService = sessionService;
        this.notificationService = notificationService;
        this.receiptService = receiptService;
        this.reservationRepository = reservationRepository;
        this.tableService = tableService;
    }

    /**
     * 주문 조회
     */
    public Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order", orderId));
    }

    /**
     * 학과 소속 주문 조회 (권한 체크 포함)
     */
    public Order getOrderForDepartment(Long departmentId, Long orderId) {
        Order order = getOrder(orderId);
        if (!order.getDepartmentId().equals(departmentId)) {
            throw new NotFoundException("Order", orderId);
        }
        return order;
    }

    /**
     * 주문 아이템 조회
     */
    public List<OrderItem> getOrderItems(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    /**
     * 학과 주문 목록
     */
    public List<Order> getOrdersByDepartment(Long departmentId) {
        return orderRepository.findByDepartmentIdOrderByCreatedAtDesc(departmentId);
    }

    /**
     * 학과 + 상태로 조회
     */
    public List<Order> getOrdersByStatus(Long departmentId, OrderStatus status) {
        return orderRepository.findByDepartmentIdAndStatusOrderByCreatedAtDesc(departmentId, status);
    }

    /**
     * 세션의 주문 목록
     */
    public List<Order> getOrdersBySession(Long sessionId) {
        return orderRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
    }

    /**
     * 주문 목록을 DTO로 변환 (아이템/테이블 정보 포함)
     */
    public List<OrderDto> toOrderDtos(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return List.of();
        }

        List<Long> orderIds = orders.stream()
                .map(Order::getId)
                .toList();

        Map<Long, List<OrderItemDto>> itemsMap = orderItemRepository.findByOrderIdIn(orderIds)
                .stream()
                .collect(Collectors.groupingBy(
                        OrderItem::getOrderId,
                        Collectors.mapping(OrderItemDto::from, Collectors.toList())
                ));

        Set<Long> tableIds = orders.stream()
                .map(Order::getTableId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> tableCodeMap = tableIds.isEmpty()
                ? Map.of()
                : tableService.getTablesByIds(tableIds).stream()
                    .collect(Collectors.toMap(DepartmentTable::getId, DepartmentTable::getCode));

        return orders.stream()
                .map(order -> {
                    List<OrderItemDto> orderItems = itemsMap.getOrDefault(order.getId(), List.of());
                    String tableCode = order.getTableId() != null
                            ? tableCodeMap.get(order.getTableId())
                            : null;
                    return OrderDto.from(order, orderItems, tableCode);
                })
                .toList();
    }

    public OrderDto toOrderDto(Order order) {
        List<OrderDto> dtos = toOrderDtos(List.of(order));
        if (dtos.isEmpty()) {
            throw new IllegalStateException("Failed to build OrderDto");
        }
        return dtos.get(0);
    }

    /**
     * 주문 생성
     */
    @Transactional
    public Order createOrder(Long departmentId, String deptSlug, OrderCreateRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("EMPTY_ITEMS", "주문 아이템이 비어있습니다");
        }

        Order order = new Order();
        order.setDepartmentId(departmentId);
        order.setNote(request.note());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);

        // 세션 연결 + 전화번호 가져오기
        String guestPhone = null;
        GuestSession session = null;
        boolean hasExistingOrder = false;
        boolean includeTableFeeFlag = request.includeTableFee() == null ? true : request.includeTableFee();
        
        if (request.sessionId() != null) {
            session = sessionService.getSession(request.sessionId());
            order.setSessionId(session.getId());
            order.setTableId(session.getTableId());
            order.setReservationId(session.getReservationId());
            hasExistingOrder = orderRepository.existsBySessionId(session.getId());
            
            // 예약에서 전화번호 가져오기
            if (session.getReservationId() != null) {
                Reservation reservation = reservationRepository.findById(session.getReservationId()).orElse(null);
                if (reservation != null) {
                    guestPhone = reservation.getPhone();
                }
            }
        } else if (request.reservationId() != null) {
            order.setReservationId(request.reservationId());
            // 예약에서 전화번호 가져오기
            Reservation reservation = reservationRepository.findById(request.reservationId()).orElse(null);
            if (reservation != null) {
                guestPhone = reservation.getPhone();
            }
        }
        
        // 요청에 전화번호가 직접 포함된 경우 (우선순위 높음)
        if (request.guestPhone() != null && !request.guestPhone().isBlank()) {
            guestPhone = request.guestPhone();
        }
        
        order.setGuestPhone(guestPhone);

        // 먼저 저장해서 ID 확보
        order = orderRepository.save(order);

        // 아이템 생성
        List<OrderItem> items = new ArrayList<>();
        for (OrderItemRequest itemReq : request.items()) {
            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setMenuId(itemReq.menuId());
            item.setQuantity(itemReq.quantity());
            
            // 메뉴 ID가 있으면 DB에서 메뉴 정보 조회
            if (itemReq.menuId() != null) {
                Menu menu = menuRepository.findById(itemReq.menuId()).orElse(null);
                if (menu != null) {
                    item.setName(menu.getName());
                    item.setPrice(menu.getPrice());
                } else {
                    // 메뉴가 삭제되었거나 없는 경우
                    item.setName(itemReq.name() != null ? itemReq.name() : "삭제된 메뉴");
                    item.setPrice(itemReq.price() != null ? itemReq.price() : 0);
                }
            } else {
                // 수기 메뉴인 경우
                item.setName(itemReq.name() != null ? itemReq.name() : "수기 메뉴");
                item.setPrice(itemReq.price() != null ? itemReq.price() : 0);
            }
            
            items.add(orderItemRepository.save(item));
        }

        // 가격 계산
        PriceBreakdown price = pricingService.calculate(departmentId, items, request.discountCode());

        // 추가 주문이면 테이블비/콜키지 재부과 없음
        int tableFee = (!hasExistingOrder && includeTableFeeFlag) ? price.tableFee() : 0;
        int corkage = 0; // 콜키지 미사용
        int total = price.subtotal() + tableFee + corkage + price.discount(); // discount may be negative
        if (total < 0) total = 0;

        order.setSubtotal(price.subtotal());
        order.setTableFee(tableFee);
        order.setCorkage(corkage);
        order.setDiscount(price.discount());
        order.setTotalPrice(total);

        Order savedOrder = orderRepository.save(order);
        
        // 새 주문 알림 전송
        if (deptSlug != null) {
            notificationService.notifyNewOrder(deptSlug, savedOrder);
            notificationService.notifyKitchen(deptSlug, savedOrder, "NEW_ORDER");
        }
        
        return savedOrder;
    }

    /**
     * 주문 상태 변경
     */
    @Transactional
    public Order updateStatus(Long orderId, OrderStatus status) {
        return updateStatus(orderId, status, null);
    }
    
    @Transactional
    public Order updateStatus(Long orderId, OrderStatus status, String deptSlug) {
        Order order = getOrder(orderId);
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        
        if (deptSlug != null) {
            notificationService.notifyOrderStatusChanged(deptSlug, savedOrder);
            if (status == OrderStatus.PREPARING) {
                notificationService.notifyKitchen(deptSlug, savedOrder, "PREPARE");
            } else if (status == OrderStatus.DONE) {
                notificationService.notifyKitchen(deptSlug, savedOrder, "DONE");
            }
        }
        
        return savedOrder;
    }

    /**
     * 결제 상태 변경
     */
    @Transactional
    public Order updatePaymentStatus(Long orderId, PaymentStatus paymentStatus) {
        return updatePaymentStatus(orderId, paymentStatus, null);
    }
    
    @Transactional
    public Order updatePaymentStatus(Long orderId, PaymentStatus paymentStatus, String deptSlug) {
        Order order = getOrder(orderId);
        order.setPaymentStatus(paymentStatus);
        
        // 결제 확인되면 주문 상태도 PREPARING으로
        if (paymentStatus == PaymentStatus.CONFIRMED && order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.PREPARING);
        }
        
        Order savedOrder = orderRepository.save(order);
        
        // 결제 확인 알림
        if (deptSlug != null && paymentStatus == PaymentStatus.CONFIRMED) {
            notificationService.notifyPaymentConfirmed(deptSlug, savedOrder);
            notificationService.notifyKitchen(deptSlug, savedOrder, "PAYMENT_CONFIRMED");
            
            // 자동 SMS 영수증 전송
            if (savedOrder.getGuestPhone() != null && !savedOrder.getGuestPhone().isBlank()) {
                try {
                    boolean sent = receiptService.sendPaymentConfirmation(savedOrder, savedOrder.getGuestPhone());
                    log.info("Auto SMS receipt sent: orderId={} phone={} success={}", 
                            orderId, savedOrder.getGuestPhone(), sent);
                } catch (Exception e) {
                    log.error("Failed to send auto SMS receipt: orderId={}", orderId, e);
                }
            }
        }
        
        return savedOrder;
    }

    /**
     * 주문 취소
     */
    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = getOrder(orderId);
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        return orderRepository.save(order);
    }
}

