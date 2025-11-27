package com.kupub.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 권한이 없을 때 발생하는 예외 (403)
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }

    public ForbiddenException(String code, String message) {
        super(HttpStatus.FORBIDDEN, code, message);
    }
}

