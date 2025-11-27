package com.kupub.api.department.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 학과(부서) 엔티티
 */
@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * URL용 슬러그 (예: "cs", "design")
     */
    @Column(nullable = false, unique = true, length = 50)
    private String slug;

    /**
     * 표시 이름 (예: "컴퓨터공학과")
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 활성화 여부
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

    public Department() {
    }

    // ========== Getters & Setters ==========

    public Long getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getActive() {
        return active;
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(active);
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

