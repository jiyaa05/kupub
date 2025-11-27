package com.kupub.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 리소스를 찾을 수 없을 때 발생하는 예외 (404)
 */
public class NotFoundException extends BusinessException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }

    public NotFoundException(String resourceType, Long id) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", resourceType + " not found: " + id);
    }

    public NotFoundException(String resourceType, String identifier) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", resourceType + " not found: " + identifier);
    }
}

