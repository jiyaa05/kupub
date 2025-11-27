package com.kupub.api.session.dto;

import com.kupub.api.session.entity.GuestSession;
import com.kupub.api.session.entity.SessionStatus;
import com.kupub.api.session.entity.SessionType;

import java.time.LocalDateTime;

/**
 * 세션 응답 DTO
 */
public record SessionDto(
        Long id,
        Long departmentId,
        SessionType type,
        Long reservationId,
        Long tableId,
        String tableCode,        // 조인해서 채움
        String sessionCode,
        String guestName,
        String guestPhone,
        Integer people,
        SessionStatus status,
        LocalDateTime createdAt,
        LocalDateTime closedAt
) {
    public static SessionDto from(GuestSession session) {
        return from(session, null);
    }

    public static SessionDto from(GuestSession session, String tableCode) {
        return new SessionDto(
                session.getId(),
                session.getDepartmentId(),
                session.getType(),
                session.getReservationId(),
                session.getTableId(),
                tableCode,
                session.getSessionCode(),
                session.getGuestName(),
                session.getGuestPhone(),
                session.getPeople(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getClosedAt()
        );
    }
}

