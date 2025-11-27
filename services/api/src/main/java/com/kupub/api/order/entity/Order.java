package com.kupub.api.order.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 주문 엔티티
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long departmentId;

    // ========== 연결 정보 ==========

    /**
     * 세션 ID (GuestSession)
     */
    private Long sessionId;

    /**
     * 테이블 ID (조회 편의용, 세션에서 복사)
     */
    private Long tableId;

    /**
     * 예약 ID (하위 호환 + 직접 연결)
     */
    private Long reservationId;

    // ========== 금액 ==========

    /**
     * 메뉴 소계 (테이블비/할인 제외)
     */
    @Column(nullable = false)
    private Integer subtotal = 0;

    /**
     * 테이블비
     */
    private Integer tableFee = 0;

    /**
     * 콜키지
     */
    private Integer corkage = 0;

    /**
     * 할인 금액 (음수)
     */
    private Integer discount = 0;

    /**
     * 총 금액 (subtotal + tableFee + corkage + discount)
     */
    @Column(nullable = false)
    private Integer totalPrice = 0;

    // ========== 상태 ==========

    /**
     * 주문 상태 (주방/서빙 기준)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;

    /**
     * 결제 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    // ========== 기타 ==========

    /**
     * 손님 메모
     */
    @Column(length = 500)
    private String note;

    /**
     * 손님 전화번호 (SMS 발송용)
     */
    @Column(length = 20)
    private String guestPhone;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ========== Lifecycle ==========

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ========== Constructors ==========

    public Order() {
    }

    // ========== Business Methods ==========

    /**
     * 총액 계산
     */
    public void calculateTotal() {
        this.totalPrice = (subtotal != null ? subtotal : 0)
                + (tableFee != null ? tableFee : 0)
                + (corkage != null ? corkage : 0)
                + (discount != null ? discount : 0);
    }

    // ========== Getters & Setters ==========

    public Long getId() {
        return id;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getTableId() {
        return tableId;
    }

    public void setTableId(Long tableId) {
        this.tableId = tableId;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Integer getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Integer subtotal) {
        this.subtotal = subtotal;
    }

    public Integer getTableFee() {
        return tableFee;
    }

    public void setTableFee(Integer tableFee) {
        this.tableFee = tableFee;
    }

    public Integer getCorkage() {
        return corkage;
    }

    public void setCorkage(Integer corkage) {
        this.corkage = corkage;
    }

    public Integer getDiscount() {
        return discount;
    }

    public void setDiscount(Integer discount) {
        this.discount = discount;
    }

    public Integer getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Integer totalPrice) {
        this.totalPrice = totalPrice;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

