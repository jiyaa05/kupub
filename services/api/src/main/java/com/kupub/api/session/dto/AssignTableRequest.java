package com.kupub.api.session.dto;

/**
 * 테이블 배정 요청 DTO
 * tableId가 null이면 배정 해제를 의미
 */
public record AssignTableRequest(
        Long tableId
) {
}

