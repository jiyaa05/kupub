package com.kupub.api.table.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 테이블 엔티티
 * - 학과별 테이블 관리
 * - 관리자가 드래그로 배치할 수 있는 레이아웃 정보 포함
 */
@Entity
@Table(name = "department_tables")
public class DepartmentTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long departmentId;

    /**
     * 테이블 코드 (T1, T2, A1, B2 등)
     * - 주방 화면에서 표시됨
     * - 학과 내 고유해야 함
     */
    @Column(nullable = false, length = 10)
    private String code;

    /**
     * 테이블 이름 (선택)
     * - "창가 테이블", "VIP석" 등
     */
    @Column(length = 50)
    private String name;

    /**
     * 수용 인원
     */
    private Integer capacity;

    // ========== 배치 정보 (관리자 레이아웃용) ==========

    /**
     * X 좌표 (픽셀 또는 그리드 단위)
     */
    private Integer posX;

    /**
     * Y 좌표
     */
    private Integer posY;

    /**
     * 너비
     */
    private Integer width;

    /**
     * 높이
     */
    private Integer height;

    /**
     * 활성화 여부
     * - false면 레이아웃에서 숨김
     */
    @Column(nullable = false)
    private Boolean active = true;

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

    public DepartmentTable() {
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getPosX() {
        return posX;
    }

    public void setPosX(Integer posX) {
        this.posX = posX;
    }

    public Integer getPosY() {
        return posY;
    }

    public void setPosY(Integer posY) {
        this.posY = posY;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

