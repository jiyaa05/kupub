package com.kupub.api.reservation.repository;

import com.kupub.api.reservation.entity.Reservation;
import com.kupub.api.reservation.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);
    List<Reservation> findByDepartmentIdAndStatusOrderByCreatedAtAsc(Long departmentId, ReservationStatus status);
    void deleteByDepartmentId(Long departmentId);
}

