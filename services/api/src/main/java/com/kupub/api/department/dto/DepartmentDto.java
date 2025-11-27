package com.kupub.api.department.dto;

import com.kupub.api.department.entity.Department;

/**
 * 학과 정보 DTO
 */
public record DepartmentDto(
        Long id,
        String slug,
        String name,
        Boolean active
) {
    public static DepartmentDto from(Department department) {
        return new DepartmentDto(
                department.getId(),
                department.getSlug(),
                department.getName(),
                department.getActive()
        );
    }
}

