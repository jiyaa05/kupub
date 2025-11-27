package com.kupub.api.table.repository;

import com.kupub.api.table.entity.DepartmentTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<DepartmentTable, Long> {

    /**
     * 학과의 모든 테이블 조회 (코드순 정렬)
     */
    List<DepartmentTable> findByDepartmentIdOrderByCodeAsc(Long departmentId);

    /**
     * 학과의 활성화된 테이블만 조회
     */
    List<DepartmentTable> findByDepartmentIdAndActiveTrueOrderByCodeAsc(Long departmentId);

    /**
     * 학과 + 코드로 테이블 조회
     */
    Optional<DepartmentTable> findByDepartmentIdAndCode(Long departmentId, String code);

    /**
     * 학과 내 코드 중복 체크
     */
    boolean existsByDepartmentIdAndCode(Long departmentId, String code);

    /**
     * 학과 내 코드 중복 체크 (자기 자신 제외)
     */
    boolean existsByDepartmentIdAndCodeAndIdNot(Long departmentId, String code, Long id);

    /**
     * 학과의 모든 테이블 삭제
     */
    void deleteByDepartmentId(Long departmentId);
}

