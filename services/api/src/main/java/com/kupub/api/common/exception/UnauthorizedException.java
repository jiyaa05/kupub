package com.kupub.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 인증되지 않았을 때 발생하는 예외 (401)
 */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }

    public UnauthorizedException(String code, String message) {
        super(HttpStatus.UNAUTHORIZED, code, message);
    }
}

