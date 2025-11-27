package com.kupub.api.reservation.service;

import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.department.service.DepartmentSettingsService;
import com.kupub.api.reservation.dto.ReservationCreateRequest;
import com.kupub.api.reservation.entity.Reservation;
import com.kupub.api.reservation.entity.ReservationStatus;
import com.kupub.api.reservation.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final DepartmentSettingsService settingsService;

    public ReservationService(ReservationRepository reservationRepository,
                              DepartmentSettingsService settingsService) {
        this.reservationRepository = reservationRepository;
        this.settingsService = settingsService;
    }

    public Reservation getReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation", id));
    }

    public List<Reservation> getByDepartment(Long departmentId) {
        return reservationRepository.findByDepartmentIdOrderByCreatedAtDesc(departmentId);
    }

    public List<Reservation> getByStatus(Long departmentId, ReservationStatus status) {
        return reservationRepository.findByDepartmentIdAndStatusOrderByCreatedAtAsc(departmentId, status);
    }

    @Transactional
    public Reservation create(Long departmentId, ReservationCreateRequest req) {
        // 마감 슬롯 체크
        Map<String, Object> settings = settingsService.getRawSettings(departmentId);
        List<String> closed = (List<String>) settings.get("reservationClosed");
        String incoming = req.reservationTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        
        if (closed != null && closed.contains(incoming)) {
            throw new BadRequestException("SLOT_CLOSED", "this time slot is closed");
        }

        Reservation r = new Reservation();
        r.setDepartmentId(departmentId);
        r.setName(req.name());
        r.setPhone(req.phone());
        r.setReservationTime(req.reservationTime());
        r.setPeople(req.people());
        r.setStatus(ReservationStatus.WAITING);

        return reservationRepository.save(r);
    }

    @Transactional
    public Reservation updateStatus(Long id, ReservationStatus status) {
        Reservation r = getReservation(id);
        r.setStatus(status);
        if (status == ReservationStatus.SEATED) {
            r.setSeatedAt(java.time.LocalDateTime.now());
        } else if (status == ReservationStatus.DONE) {
            r.setFinishedAt(java.time.LocalDateTime.now());
        }
        return reservationRepository.save(r);
    }
}

