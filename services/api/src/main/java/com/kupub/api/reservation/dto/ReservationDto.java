package com.kupub.api.reservation.dto;

import com.kupub.api.reservation.entity.Reservation;
import com.kupub.api.reservation.entity.ReservationStatus;
import java.time.LocalDateTime;

public record ReservationDto(
        Long id, Long departmentId, String name, String phone,
        LocalDateTime reservationTime, Integer people,
        ReservationStatus status, Long tableId, String tableCode,
        LocalDateTime createdAt
) {
    public static ReservationDto from(Reservation r) {
        return from(r, null);
    }
    public static ReservationDto from(Reservation r, String tableCode) {
        return new ReservationDto(r.getId(), r.getDepartmentId(), r.getName(), r.getPhone(),
                r.getReservationTime(), r.getPeople(), r.getStatus(), r.getTableId(), tableCode,
                r.getCreatedAt());
    }
}

