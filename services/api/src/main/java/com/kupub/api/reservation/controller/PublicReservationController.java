package com.kupub.api.reservation.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.reservation.dto.*;
import com.kupub.api.reservation.entity.Reservation;
import com.kupub.api.reservation.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{dept}/reservations")
@CrossOrigin(origins = "*")
public class PublicReservationController {

    private final ReservationService reservationService;
    private final DepartmentService departmentService;

    public PublicReservationController(ReservationService reservationService,
                                       DepartmentService departmentService) {
        this.reservationService = reservationService;
        this.departmentService = departmentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationDto>> create(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody ReservationCreateRequest request) {

        Long deptId = departmentService.getActiveBySlug(deptSlug).getId();
        Reservation r = reservationService.create(deptId, request);
        return ResponseEntity.ok(ApiResponse.ok(ReservationDto.from(r)));
    }
}

