package com.kupub.api.table.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 테이블 레이아웃 일괄 저장 요청 DTO
 */
public record TableLayoutRequest(
        @NotNull(message = "테이블 목록은 필수입니다")
        @Valid
        List<TableLayoutItem> tables
) {
    /**
     * 개별 테이블 레이아웃 정보
     */
    public record TableLayoutItem(
            @NotNull(message = "테이블 ID는 필수입니다")
            Long id,
            Integer posX,
            Integer posY,
            Integer width,
            Integer height
    ) {
    }
}

