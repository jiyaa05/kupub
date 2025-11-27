package com.kupub.api.table.dto;

import jakarta.validation.constraints.Size;

/**
 * 테이블 수정 요청 DTO
 * - 모든 필드 선택적 (null이면 변경 안 함)
 */
public record TableUpdateRequest(
        @Size(max = 10, message = "테이블 코드는 10자 이하여야 합니다")
        String code,

        @Size(max = 50, message = "테이블 이름은 50자 이하여야 합니다")
        String name,

        Integer capacity,
        Integer posX,
        Integer posY,
        Integer width,
        Integer height,
        Boolean active
) {
}

