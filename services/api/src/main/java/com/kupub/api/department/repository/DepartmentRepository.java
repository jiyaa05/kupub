package com.kupub.api.department.repository;

import com.kupub.api.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Department> findAllByOrderByNameAsc();

    List<Department> findByActiveTrueOrderByNameAsc();
}

