package com.kupub.api.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 공통 API 응답 래퍼
 * 
 * 성공: { "data": {...}, "error": null }
 * 실패: { "data": null, "error": { "code": "...", "message": "..." } }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private final T data;
    private final ErrorInfo error;

    private ApiResponse(T data, ErrorInfo error) {
        this.data = data;
        this.error = error;
    }

    // ========== Factory Methods ==========

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(null, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(null, new ErrorInfo(code, message, null));
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return new ApiResponse<>(null, new ErrorInfo(code, message, details));
    }

    // ========== Getters ==========

    public T getData() {
        return data;
    }

    public ErrorInfo getError() {
        return error;
    }

    // ========== Error Info ==========

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorInfo {
        private final String code;
        private final String message;
        private final Object details;

        public ErrorInfo(String code, String message, Object details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public Object getDetails() {
            return details;
        }
    }
}

