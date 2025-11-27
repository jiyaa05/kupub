package com.kupub.api.session.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 손님 세션 엔티티
 * - 예약, QR 스캔, 코드 입력 등 다양한 방식으로 생성
 * - 주문과 연결되어 테이블 추적 가능
 */
@Entity
@Table(name = "guest_sessions")
public class GuestSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long departmentId;

    /**
     * 세션 타입 (RESERVATION, QR, CODE)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionType type;

    /**
     * 연결된 예약 ID (예약 타입이면 필수)
     */
    private Long reservationId;

    /**
     * 연결된 테이블 ID
     * - QR 스캔 시 자동 연결
     * - 관리자가 수동 배정 가능
     */
    private Long tableId;

    /**
     * 세션 코드 (CODE 타입이면 필수)
     * - 관리자가 부여하거나 자동 생성
     */
    @Column(length = 20)
    private String sessionCode;

    /**
     * 손님 이름 (예약 없이 진입한 경우)
     */
    @Column(length = 50)
    private String guestName;

    /**
     * 손님 연락처
     */
    @Column(length = 20)
    private String guestPhone;

    /**
     * 인원 수
     */
    private Integer people;

    /**
     * 세션 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.ACTIVE;

    private LocalDateTime createdAt;
    private LocalDateTime closedAt;

    // ========== Lifecycle ==========

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ========== Constructors ==========

    public GuestSession() {
    }

    // ========== Business Methods ==========

    /**
     * 세션 종료
     */
    public void close() {
        this.status = SessionStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
    }

    public void reopen() {
        this.status = SessionStatus.ACTIVE;
        this.closedAt = null;
    }

    /**
     * 테이블 배정
     */
    public void assignTable(Long tableId) {
        this.tableId = tableId;
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

    public SessionType getType() {
        return type;
    }

    public void setType(SessionType type) {
        this.type = type;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getTableId() {
        return tableId;
    }

    public void setTableId(Long tableId) {
        this.tableId = tableId;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public Integer getPeople() {
        return people;
    }

    public void setPeople(Integer people) {
        this.people = people;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }
}

