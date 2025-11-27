package com.kupub.api.session.service;

import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.reservation.entity.Reservation;
import com.kupub.api.reservation.repository.ReservationRepository;
import com.kupub.api.session.dto.StartSessionRequest;
import com.kupub.api.session.entity.GuestSession;
import com.kupub.api.session.entity.SessionStatus;
import com.kupub.api.session.entity.SessionType;
import com.kupub.api.session.repository.GuestSessionRepository;
import com.kupub.api.table.entity.DepartmentTable;
import com.kupub.api.table.service.TableService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SessionService {

    private final GuestSessionRepository sessionRepository;
    private final TableService tableService;
    private final ReservationRepository reservationRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    public SessionService(GuestSessionRepository sessionRepository, TableService tableService, ReservationRepository reservationRepository) {
        this.sessionRepository = sessionRepository;
        this.tableService = tableService;
        this.reservationRepository = reservationRepository;
    }

    /**
     * 세션 조회
     */
    public GuestSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session", sessionId));
    }

    /**
     * 학과의 활성 세션 목록
     */
    public List<GuestSession> getActiveSessions(Long departmentId) {
        return sessionRepository.findByDepartmentIdAndStatusOrderByCreatedAtDesc(
                departmentId, SessionStatus.ACTIVE);
    }

    /**
     * 학과의 모든 세션
     */
    public List<GuestSession> getAllSessions(Long departmentId) {
        return sessionRepository.findByDepartmentIdOrderByCreatedAtDesc(departmentId);
    }

    /**
     * 예약 ID로 세션 조회
     */
    public GuestSession getSessionByReservation(Long reservationId) {
        return sessionRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new NotFoundException("Session for reservation", reservationId));
    }

    /**
     * 세션 코드로 조회
     */
    public GuestSession getSessionByCode(Long departmentId, String code) {
        return sessionRepository.findByDepartmentIdAndSessionCode(departmentId, code)
                .orElseThrow(() -> new NotFoundException("Session", code));
    }

    /**
     * 세션 시작
     */
    @Transactional
    public GuestSession startSession(Long departmentId, StartSessionRequest request) {
        GuestSession session = new GuestSession();
        session.setDepartmentId(departmentId);
        session.setType(request.type());
        session.setStatus(SessionStatus.ACTIVE);

        switch (request.type()) {
            case RESERVATION:
                if (request.reservationId() == null) {
                    throw new BadRequestException("RESERVATION_REQUIRED", "예약 ID가 필요합니다");
                }
                // 이미 해당 예약으로 세션이 있는지 체크
                if (sessionRepository.findByReservationId(request.reservationId()).isPresent()) {
                    throw new BadRequestException("SESSION_EXISTS", "이미 해당 예약으로 세션이 생성되었습니다");
                }
                session.setReservationId(request.reservationId());

                // 예약 정보로 기본 손님 정보 채우기
                Reservation reservation = reservationRepository.findById(request.reservationId())
                        .orElseThrow(() -> new NotFoundException("Reservation", request.reservationId()));
                session.setGuestName(reservation.getName());
                session.setGuestPhone(reservation.getPhone());
                session.setPeople(reservation.getPeople());
                break;

            case QR:
                if (request.tableId() == null) {
                    throw new BadRequestException("TABLE_REQUIRED", "테이블 ID가 필요합니다");
                }
                // 해당 테이블에 활성 세션이 있는지 체크
                if (sessionRepository.findByTableIdAndStatus(request.tableId(), SessionStatus.ACTIVE).isPresent()) {
                    throw new BadRequestException("TABLE_OCCUPIED", "해당 테이블에 이미 활성 세션이 있습니다");
                }
                session.setTableId(request.tableId());
                break;

            case CODE:
                String code = request.sessionCode();
                if (code == null || code.isBlank()) {
                    // 코드 자동 생성
                    code = generateSessionCode(departmentId);
                }
                session.setSessionCode(code);
                break;
        }

        // 손님 정보 (선택)
        if (request.guestName() != null && !request.guestName().isBlank()) {
            session.setGuestName(request.guestName());
        }
        if (request.guestPhone() != null && !request.guestPhone().isBlank()) {
            session.setGuestPhone(request.guestPhone());
        }
        if (request.people() != null) {
            session.setPeople(request.people());
        }

        return sessionRepository.save(session);
    }

    /**
     * 테이블 배정
     */
    @Transactional
    public GuestSession assignTable(Long departmentId, Long sessionId, Long tableId) {
        GuestSession session = getSession(sessionId);

        if (!session.getDepartmentId().equals(departmentId)) {
            throw new NotFoundException("Session", sessionId);
        }

        if (tableId == null) {
            session.assignTable(null);
            return sessionRepository.save(session);
        }

        // 테이블 존재 확인
        DepartmentTable table = tableService.getTable(tableId);
        if (!table.getDepartmentId().equals(departmentId)) {
            throw new BadRequestException("INVALID_TABLE", "해당 학과의 테이블이 아닙니다: " + tableId);
        }

        // 해당 테이블에 다른 활성 세션이 있는지 체크
        sessionRepository.findByTableIdAndStatus(tableId, SessionStatus.ACTIVE)
                .filter(s -> !s.getId().equals(sessionId))
                .ifPresent(s -> {
                    throw new BadRequestException("TABLE_OCCUPIED", "해당 테이블에 이미 다른 세션이 있습니다");
                });

        session.assignTable(tableId);
        return sessionRepository.save(session);
    }

    /**
     * 세션 종료
     */
    @Transactional
    public GuestSession closeSession(Long departmentId, Long sessionId) {
        GuestSession session = getSession(sessionId);
        if (!session.getDepartmentId().equals(departmentId)) {
            throw new NotFoundException("Session", sessionId);
        }
        session.close();
        return sessionRepository.save(session);
    }

    /**
     * 세션 재오픈 (퇴장 취소)
     */
    @Transactional
    public GuestSession reopenSession(Long departmentId, Long sessionId) {
        GuestSession session = getSession(sessionId);
        if (!session.getDepartmentId().equals(departmentId)) {
            throw new NotFoundException("Session", sessionId);
        }
        session.reopen();
        return sessionRepository.save(session);
    }

    /**
     * 세션 삭제
     */
    @Transactional
    public void deleteSession(Long departmentId, Long sessionId) {
        GuestSession session = getSession(sessionId);
        if (!session.getDepartmentId().equals(departmentId)) {
            throw new NotFoundException("Session", sessionId);
        }
        sessionRepository.delete(session);
    }

    /**
     * 세션 코드 생성 (6자리 영숫자)
     */
    private String generateSessionCode(Long departmentId) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 문자 제외
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }

        String code = sb.toString();

        // 중복 체크
        if (sessionRepository.existsByDepartmentIdAndSessionCode(departmentId, code)) {
            return generateSessionCode(departmentId); // 재귀 (매우 드묾)
        }

        return code;
    }
}

