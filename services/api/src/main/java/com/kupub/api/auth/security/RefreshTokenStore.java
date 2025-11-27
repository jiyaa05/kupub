package com.kupub.api.auth.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * 인메모리 Refresh Token 저장소
 * (프로덕션에서는 Redis 등으로 교체 권장)
 */
@Component
public class RefreshTokenStore {

    private final ConcurrentHashMap<String, String> store = new ConcurrentHashMap<>();

    public void save(String token, String username) {
        store.put(token, username);
    }

    public boolean exists(String token) {
        return store.containsKey(token);
    }

    public void remove(String token) {
        store.remove(token);
    }

    public String getUsername(String token) {
        return store.get(token);
    }
}

