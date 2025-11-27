package com.kupub.api.auth.security;

import com.kupub.api.user.entity.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessExpireMs;
    private final long refreshExpireMs;

    public JwtTokenProvider(
            @Value("${jwt.secret:kupub-default-secret-key-must-be-at-least-32-characters}") String secret,
            @Value("${jwt.access-expire-ms:3600000}") long accessExpireMs,
            @Value("${jwt.refresh-expire-ms:604800000}") long refreshExpireMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpireMs = accessExpireMs;
        this.refreshExpireMs = refreshExpireMs;
    }

    public String generateAccessToken(String username, Long userId, Long departmentId, UserRole role) {
        return buildToken(username, userId, departmentId, role, accessExpireMs, "access");
    }

    public String generateRefreshToken(String username, Long userId, Long departmentId, UserRole role) {
        return buildToken(username, userId, departmentId, role, refreshExpireMs, "refresh");
    }

    private String buildToken(String username, Long userId, Long departmentId, UserRole role,
                              long expireMs, String type) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(username)
                .claim("uid", userId)
                .claim("deptId", departmentId)
                .claim("role", role.name())
                .claim("typ", type)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expireMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public Long getUserId(String token) {
        return getClaims(token).get("uid", Long.class);
    }

    public Long getDepartmentId(String token) {
        return getClaims(token).get("deptId", Long.class);
    }

    public UserRole getRole(String token) {
        String role = getClaims(token).get("role", String.class);
        return UserRole.valueOf(role);
    }

    public String getType(String token) {
        return getClaims(token).get("typ", String.class);
    }
}
