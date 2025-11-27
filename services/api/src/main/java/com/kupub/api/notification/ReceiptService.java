package com.kupub.api.notification;

import com.kupub.api.order.entity.Order;
import com.kupub.api.order.entity.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 영수증 메시지 서비스
 * 
 * SMS 전송을 통해 주문 영수증을 손님에게 전달합니다.
 * 각 학과별 SMS 설정을 사용합니다.
 */
@Service
public class ReceiptService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptService.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final SmsService smsService;

    public ReceiptService(SmsService smsService) {
        this.smsService = smsService;
    }

    /**
     * 주문 확인 영수증 메시지 전송
     */
    public boolean sendOrderConfirmation(Order order, List<OrderItem> items, String phoneNumber) {
        String message = buildReceiptMessage(order, items);
        
        log.info("====== 영수증 메시지 ======");
        log.info("수신자: {}", phoneNumber);
        log.info("내용:\n{}", message);
        log.info("==========================");
        
        return smsService.sendSms(order.getDepartmentId(), phoneNumber, message);
    }

    /**
     * 결제 완료 알림 전송
     */
    public boolean sendPaymentConfirmation(Order order, String phoneNumber) {
        String message = String.format(
            "[KUPUB] 결제가 확인되었습니다.\n\n" +
            "주문번호: #%d\n" +
            "결제금액: %,d원\n\n" +
            "주문이 곧 준비됩니다. 감사합니다!",
            order.getId(),
            order.getTotalPrice()
        );
        
        log.info("====== 결제 확인 메시지 ======");
        log.info("수신자: {}", phoneNumber);
        log.info("내용:\n{}", message);
        log.info("==============================");
        
        return smsService.sendSms(order.getDepartmentId(), phoneNumber, message);
    }

    /**
     * 주문 완료 알림 전송
     */
    public boolean sendOrderCompleted(Order order, String phoneNumber) {
        String message = String.format(
            "[KUPUB] 주문이 완료되었습니다!\n\n" +
            "주문번호: #%d\n" +
            "음식이 준비되었습니다!",
            order.getId()
        );
        
        log.info("====== 주문 완료 메시지 ======");
        log.info("수신자: {}", phoneNumber);
        log.info("내용:\n{}", message);
        log.info("==============================");
        
        return smsService.sendSms(order.getDepartmentId(), phoneNumber, message);
    }

    /**
     * 해당 학과의 SMS 설정 여부 확인
     */
    public boolean isSmsConfigured(Long departmentId) {
        return smsService.isConfigured(departmentId);
    }

    private String buildReceiptMessage(Order order, List<OrderItem> items) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("[KUPUB] 주문 영수증\n\n");
        sb.append(String.format("주문번호: #%d\n", order.getId()));
        sb.append(String.format("주문일시: %s\n\n", order.getCreatedAt().format(formatter)));
        
        sb.append("──────────────\n");
        sb.append("[ 주문 내역 ]\n");
        
        for (OrderItem item : items) {
            sb.append(String.format("%s x%d - %,d원\n", 
                item.getName(), item.getQuantity(), item.getSubtotal()));
        }
        
        sb.append("──────────────\n");
        sb.append(String.format("소계: %,d원\n", order.getSubtotal()));
        
        if (order.getTableFee() > 0) {
            sb.append(String.format("테이블비: %,d원\n", order.getTableFee()));
        }
        if (order.getDiscount() != 0) {
            sb.append(String.format("할인: %,d원\n", order.getDiscount()));
        }
        
        sb.append("──────────────\n");
        sb.append(String.format("총 결제금액: %,d원\n", order.getTotalPrice()));
        sb.append("\n감사합니다!");
        
        return sb.toString();
    }
}

