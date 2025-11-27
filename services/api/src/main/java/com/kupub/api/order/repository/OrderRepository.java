package com.kupub.api.order.repository;

import com.kupub.api.order.entity.Order;
import com.kupub.api.order.entity.OrderStatus;
import com.kupub.api.order.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * 학과의 주문 목록 (최신순)
     */
    List<Order> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);

    /**
     * 학과 + 주문상태로 조회
     */
    List<Order> findByDepartmentIdAndStatusOrderByCreatedAtDesc(Long departmentId, OrderStatus status);

    /**
     * 학과 + 결제상태로 조회
     */
    List<Order> findByDepartmentIdAndPaymentStatusOrderByCreatedAtDesc(Long departmentId, PaymentStatus paymentStatus);

    /**
     * 세션의 주문 목록
     */
    List<Order> findBySessionIdOrderByCreatedAtDesc(Long sessionId);

    /**
     * 세션에 주문 존재 여부
     */
    boolean existsBySessionId(Long sessionId);

    /**
     * 세션 주문 삭제
     */
    void deleteBySessionId(Long sessionId);

    /**
     * 테이블의 주문 목록
     */
    List<Order> findByTableIdOrderByCreatedAtDesc(Long tableId);

    /**
     * 예약의 주문 목록
     */
    List<Order> findByReservationIdOrderByCreatedAtDesc(Long reservationId);

    /**
     * 학과의 모든 주문 조회
     */
    List<Order> findByDepartmentId(Long departmentId);

    /**
     * 학과의 모든 주문 삭제
     */
    void deleteByDepartmentId(Long departmentId);
}

