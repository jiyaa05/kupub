package com.kupub.api.department.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 학과별 설정 엔티티
 * - JSON으로 유연한 설정 저장
 */
@Entity
@Table(name = "department_settings")
public class DepartmentSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 연결된 학과 ID
     */
    @Column(nullable = false, unique = true)
    private Long departmentId;

    /**
     * JSON 형태의 설정 데이터
     */
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String dataJson;

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

    public DepartmentSettings() {
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

    public String getDataJson() {
        return dataJson;
    }

    public void setDataJson(String dataJson) {
        this.dataJson = dataJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

