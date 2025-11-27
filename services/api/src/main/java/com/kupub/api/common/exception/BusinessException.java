package com.kupub.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 비즈니스 로직 예외의 기본 클래스
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Object details;

    public BusinessException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    public BusinessException(HttpStatus status, String code, String message, Object details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public Object getDetails() {
        return details;
    }
}

