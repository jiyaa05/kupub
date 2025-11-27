package com.kupub.api.table.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 테이블 생성 요청 DTO
 */
public record TableCreateRequest(
        @NotBlank(message = "테이블 코드는 필수입니다")
        @Size(max = 10, message = "테이블 코드는 10자 이하여야 합니다")
        String code,

        @Size(max = 50, message = "테이블 이름은 50자 이하여야 합니다")
        String name,

        Integer capacity,
        Integer posX,
        Integer posY,
        Integer width,
        Integer height
) {
}

