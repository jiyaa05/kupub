package com.kupub.api.department.repository;

import com.kupub.api.department.entity.DepartmentSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentSettingsRepository extends JpaRepository<DepartmentSettings, Long> {

    Optional<DepartmentSettings> findByDepartmentId(Long departmentId);
    
    void deleteByDepartmentId(Long departmentId);
}

