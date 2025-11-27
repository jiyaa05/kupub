package com.kupub.api.table.service;

import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.table.dto.TableCreateRequest;
import com.kupub.api.table.dto.TableLayoutRequest;
import com.kupub.api.table.dto.TableUpdateRequest;
import com.kupub.api.table.entity.DepartmentTable;
import com.kupub.api.table.repository.TableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TableService {

    private final TableRepository tableRepository;

    public TableService(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    /**
     * 학과의 모든 테이블 조회
     */
    public List<DepartmentTable> getTablesByDepartment(Long departmentId) {
        return tableRepository.findByDepartmentIdOrderByCodeAsc(departmentId);
    }

    /**
     * 학과의 활성화된 테이블만 조회
     */
    public List<DepartmentTable> getActiveTablesByDepartment(Long departmentId) {
        return tableRepository.findByDepartmentIdAndActiveTrueOrderByCodeAsc(departmentId);
    }

    /**
     * 테이블 단건 조회
     */
    public DepartmentTable getTable(Long tableId) {
        return tableRepository.findById(tableId)
                .orElseThrow(() -> new NotFoundException("Table", tableId));
    }

    /**
     * ID 목록으로 테이블 조회 (순서는 보장되지 않음)
     */
    public List<DepartmentTable> getTablesByIds(Collection<Long> tableIds) {
        if (tableIds == null || tableIds.isEmpty()) {
            return List.of();
        }
        return tableRepository.findAllById(tableIds);
    }

    /**
     * 테이블 코드로 조회
     */
    public DepartmentTable getTableByCode(Long departmentId, String code) {
        return tableRepository.findByDepartmentIdAndCode(departmentId, code)
                .orElseThrow(() -> new NotFoundException("Table", code));
    }

    /**
     * 테이블 생성
     */
    @Transactional
    public DepartmentTable createTable(Long departmentId, TableCreateRequest request) {
        // 코드 중복 체크
        if (tableRepository.existsByDepartmentIdAndCode(departmentId, request.code())) {
            throw new BadRequestException("DUPLICATE_CODE", "이미 사용 중인 테이블 코드입니다: " + request.code());
        }

        DepartmentTable table = new DepartmentTable();
        table.setDepartmentId(departmentId);
        table.setCode(request.code());
        table.setName(request.name());
        table.setCapacity(request.capacity());
        table.setPosX(request.posX());
        table.setPosY(request.posY());
        table.setWidth(request.width());
        table.setHeight(request.height());
        table.setActive(true);

        return tableRepository.save(table);
    }

    /**
     * 테이블 수정
     */
    @Transactional
    public DepartmentTable updateTable(Long departmentId, Long tableId, TableUpdateRequest request) {
        DepartmentTable table = getTable(tableId);
        if (!table.getDepartmentId().equals(departmentId)) {
            throw new BadRequestException("INVALID_TABLE", "해당 학과의 테이블이 아닙니다: " + tableId);
        }

        // 코드 변경 시 중복 체크
        if (request.code() != null && !request.code().equals(table.getCode())) {
            if (tableRepository.existsByDepartmentIdAndCodeAndIdNot(
                    departmentId, request.code(), tableId)) {
                throw new BadRequestException("DUPLICATE_CODE", "이미 사용 중인 테이블 코드입니다: " + request.code());
            }
            table.setCode(request.code());
        }

        if (request.name() != null) {
            table.setName(request.name());
        }
        if (request.capacity() != null) {
            table.setCapacity(request.capacity());
        }
        if (request.posX() != null) {
            table.setPosX(request.posX());
        }
        if (request.posY() != null) {
            table.setPosY(request.posY());
        }
        if (request.width() != null) {
            table.setWidth(request.width());
        }
        if (request.height() != null) {
            table.setHeight(request.height());
        }
        if (request.active() != null) {
            table.setActive(request.active());
        }

        return tableRepository.save(table);
    }

    /**
     * 테이블 삭제
     */
    @Transactional
    public void deleteTable(Long departmentId, Long tableId) {
        DepartmentTable table = getTable(tableId);
        if (!table.getDepartmentId().equals(departmentId)) {
            throw new BadRequestException("INVALID_TABLE", "해당 학과의 테이블이 아닙니다: " + tableId);
        }
        tableRepository.delete(table);
    }

    /**
     * 레이아웃 일괄 저장
     * - 위치 정보만 업데이트
     */
    @Transactional
    public List<DepartmentTable> updateLayout(Long departmentId, TableLayoutRequest request) {
        for (TableLayoutRequest.TableLayoutItem item : request.tables()) {
            DepartmentTable table = getTable(item.id());
            
            // 권한 체크: 해당 학과 테이블인지
            if (!table.getDepartmentId().equals(departmentId)) {
                throw new BadRequestException("INVALID_TABLE", "해당 학과의 테이블이 아닙니다: " + item.id());
            }

            if (item.posX() != null) {
                table.setPosX(item.posX());
            }
            if (item.posY() != null) {
                table.setPosY(item.posY());
            }
            if (item.width() != null) {
                table.setWidth(item.width());
            }
            if (item.height() != null) {
                table.setHeight(item.height());
            }

            tableRepository.save(table);
        }

        return getTablesByDepartment(departmentId);
    }
}

