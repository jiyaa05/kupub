package com.kupub.api.table.dto;

import com.kupub.api.table.entity.DepartmentTable;

import java.time.LocalDateTime;

/**
 * 테이블 응답 DTO
 */
public record TableDto(
        Long id,
        Long departmentId,
        String code,
        String name,
        Integer capacity,
        Integer posX,
        Integer posY,
        Integer width,
        Integer height,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TableDto from(DepartmentTable table) {
        return new TableDto(
                table.getId(),
                table.getDepartmentId(),
                table.getCode(),
                table.getName(),
                table.getCapacity(),
                table.getPosX(),
                table.getPosY(),
                table.getWidth(),
                table.getHeight(),
                table.getActive(),
                table.getCreatedAt(),
                table.getUpdatedAt()
        );
    }
}

