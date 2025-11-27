package com.kupub.api.session.repository;

import com.kupub.api.session.entity.GuestSession;
import com.kupub.api.session.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestSessionRepository extends JpaRepository<GuestSession, Long> {

    /**
     * 학과의 활성 세션 목록
     */
    List<GuestSession> findByDepartmentIdAndStatusOrderByCreatedAtDesc(
            Long departmentId, SessionStatus status);

    /**
     * 학과의 모든 세션 (최신순)
     */
    List<GuestSession> findByDepartmentIdOrderByCreatedAtDesc(Long departmentId);

    /**
     * 예약 ID로 세션 조회
     */
    Optional<GuestSession> findByReservationId(Long reservationId);

    /**
     * 세션 코드로 조회
     */
    Optional<GuestSession> findByDepartmentIdAndSessionCode(Long departmentId, String sessionCode);

    /**
     * 테이블의 활성 세션 조회
     */
    Optional<GuestSession> findByTableIdAndStatus(Long tableId, SessionStatus status);

    /**
     * 세션 코드 존재 여부
     */
    boolean existsByDepartmentIdAndSessionCode(Long departmentId, String sessionCode);

    /**
     * 학과의 모든 세션 삭제
     */
    void deleteByDepartmentId(Long departmentId);
}

