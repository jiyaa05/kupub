package com.kupub.api.department.service;

import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.department.entity.Department;
import com.kupub.api.department.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    /**
     * slug로 학과 조회
     */
    public Department getBySlug(String slug) {
        return departmentRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Department", slug));
    }

    /**
     * slug로 활성 상태의 학과 조회 (비활성은 404)
     */
    public Department getActiveBySlug(String slug) {
        Department dept = getBySlug(slug);
        if (Boolean.FALSE.equals(dept.getActive())) {
            throw new NotFoundException("Department", slug);
        }
        return dept;
    }

    /**
     * ID로 학과 조회
     */
    public Department getById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Department", id));
    }

    /**
     * 전체 학과 목록
     */
    public List<Department> getAll() {
        return departmentRepository.findAllByOrderByNameAsc();
    }

    /**
     * 활성 학과 목록
     */
    public List<Department> getActive() {
        return departmentRepository.findByActiveTrueOrderByNameAsc();
    }

    /**
     * 학과 생성
     */
    @Transactional
    public Department create(String slug, String name) {
        if (departmentRepository.existsBySlug(slug)) {
            throw new BadRequestException("DUPLICATE_SLUG", "이미 사용 중인 slug입니다: " + slug);
        }

        Department department = new Department();
        department.setSlug(slug);
        department.setName(name);
        department.setActive(true);

        return departmentRepository.save(department);
    }

    /**
     * 학과 수정
     */
    @Transactional
    public Department update(Long id, String name, Boolean active) {
        Department department = getById(id);

        if (name != null) {
            department.setName(name);
        }
        if (active != null) {
            department.setActive(active);
        }

        return departmentRepository.save(department);
    }
}

