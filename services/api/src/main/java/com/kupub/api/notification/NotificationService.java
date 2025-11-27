package com.kupub.api.notification;

import com.kupub.api.order.entity.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 새 주문 알림을 관리자에게 전송
     */
    public void notifyNewOrder(String deptSlug, Order order) {
        log.info("Sending new order notification: dept={} orderId={}", deptSlug, order.getId());
        
        OrderNotification notification = new OrderNotification(
                "NEW_ORDER",
                order.getId(),
                order.getTotalPrice(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                LocalDateTime.now().toString()
        );
        
        // /topic/{dept}/orders 로 전송
        messagingTemplate.convertAndSend("/topic/" + deptSlug + "/orders", notification);
    }

    /**
     * 주문 상태 변경 알림
     */
    public void notifyOrderStatusChanged(String deptSlug, Order order) {
        log.info("Sending order status change notification: dept={} orderId={} status={}", 
                deptSlug, order.getId(), order.getStatus());
        
        OrderNotification notification = new OrderNotification(
                "ORDER_STATUS_CHANGED",
                order.getId(),
                order.getTotalPrice(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                LocalDateTime.now().toString()
        );
        
        messagingTemplate.convertAndSend("/topic/" + deptSlug + "/orders", notification);
    }

    /**
     * 결제 상태 변경 알림 (손님에게)
     */
    public void notifyPaymentConfirmed(String deptSlug, Order order) {
        log.info("Sending payment confirmed notification: orderId={}", order.getId());
        
        Map<String, Object> notification = Map.of(
                "type", "PAYMENT_CONFIRMED",
                "orderId", order.getId(),
                "status", order.getPaymentStatus().name(),
                "timestamp", LocalDateTime.now().toString()
        );
        
        // 특정 주문에 대한 알림
        messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), notification);
    }

    /**
     * 주방용 알림 (새 주문, 준비 요청)
     */
    public void notifyKitchen(String deptSlug, Order order, String action) {
        log.info("Sending kitchen notification: dept={} orderId={} action={}", 
                deptSlug, order.getId(), action);
        
        Map<String, Object> notification = Map.of(
                "type", action,
                "orderId", order.getId(),
                "status", order.getStatus().name(),
                "timestamp", LocalDateTime.now().toString()
        );
        
        messagingTemplate.convertAndSend("/topic/" + deptSlug + "/kitchen", notification);
    }

    public record OrderNotification(
            String type,
            Long orderId,
            Integer totalPrice,
            String status,
            String paymentStatus,
            String timestamp
    ) {}
}

