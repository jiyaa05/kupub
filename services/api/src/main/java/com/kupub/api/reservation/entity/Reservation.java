package com.kupub.api.reservation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long departmentId;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Column(nullable = false)
    private LocalDateTime reservationTime;

    private Integer people;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.WAITING;

    private Long tableId;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime seatedAt;
    private LocalDateTime finishedAt;

    // Getters & Setters
    public Long getId() { return id; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public LocalDateTime getReservationTime() { return reservationTime; }
    public void setReservationTime(LocalDateTime reservationTime) { this.reservationTime = reservationTime; }
    public Integer getPeople() { return people; }
    public void setPeople(Integer people) { this.people = people; }
    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getSeatedAt() { return seatedAt; }
    public void setSeatedAt(LocalDateTime seatedAt) { this.seatedAt = seatedAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}

