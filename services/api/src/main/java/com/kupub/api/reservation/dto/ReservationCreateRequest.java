package com.kupub.api.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record ReservationCreateRequest(
        @NotBlank String name,
        String phone,
        @NotNull LocalDateTime reservationTime,
        Integer people
) {}

