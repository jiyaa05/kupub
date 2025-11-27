package com.kupub.api.auth.service;

import com.kupub.api.auth.dto.*;
import com.kupub.api.auth.security.JwtTokenProvider;
import com.kupub.api.auth.security.RefreshTokenStore;
import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.UnauthorizedException;
import com.kupub.api.department.entity.Department;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.user.entity.User;
import com.kupub.api.user.entity.UserRole;
import com.kupub.api.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DepartmentService departmentService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenStore refreshTokenStore;

    public AuthService(UserRepository userRepository,
                       DepartmentService departmentService,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       RefreshTokenStore refreshTokenStore) {
        this.userRepository = userRepository;
        this.departmentService = departmentService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenStore = refreshTokenStore;
    }

    public LoginResponse login(LoginRequest request) {
        // 1. 사용자 조회
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        // 2. 비밀번호 확인
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // 3. 계정 활성화 확인
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new UnauthorizedException("비활성화된 계정입니다");
        }

        // 4. 학과 확인 (DEPT_ADMIN인 경우)
        Long deptId = user.getDepartmentId();
        String deptSlug = null;

        if (user.getRole() == UserRole.DEPT_ADMIN) {
            if (deptId == null) {
                throw new BadRequestException("DEPT_NOT_ASSIGNED", "학과가 할당되지 않은 계정입니다");
            }

            // 요청한 학과와 계정 학과 일치 확인
            if (request.departmentSlug() != null) {
                Department reqDept = departmentService.getBySlug(request.departmentSlug());
                if (!reqDept.getId().equals(deptId)) {
                    throw new UnauthorizedException("해당 학과에 대한 권한이 없습니다");
                }
                deptSlug = reqDept.getSlug();
            } else if (request.departmentId() != null) {
                if (!request.departmentId().equals(deptId)) {
                    throw new UnauthorizedException("해당 학과에 대한 권한이 없습니다");
                }
            }

            if (deptSlug == null) {
                Department dept = departmentService.getById(deptId);
                deptSlug = dept.getSlug();
            }
        }

        // 5. 토큰 생성
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getUsername(), user.getId(), deptId, user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getUsername(), user.getId(), deptId, user.getRole());

        // 6. Refresh 토큰 저장
        refreshTokenStore.save(refreshToken, user.getUsername());

        return new LoginResponse(
                accessToken, refreshToken, user.getUsername(),
                deptId, deptSlug, user.getRole().name());
    }

    public RefreshResponse refresh(RefreshRequest request) {
        String refreshToken = request.refreshToken();

        // 1. 토큰 검증
        if (!jwtTokenProvider.validate(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        // 2. 타입 확인
        if (!"refresh".equals(jwtTokenProvider.getType(refreshToken))) {
            throw new UnauthorizedException("Invalid token type");
        }

        // 3. 저장소에 있는지 확인
        if (!refreshTokenStore.exists(refreshToken)) {
            throw new UnauthorizedException("Refresh token not found");
        }

        // 4. 새 access token 발급
        String username = jwtTokenProvider.getUsername(refreshToken);
        Long userId = jwtTokenProvider.getUserId(refreshToken);
        Long deptId = jwtTokenProvider.getDepartmentId(refreshToken);
        UserRole role = jwtTokenProvider.getRole(refreshToken);

        String newAccessToken = jwtTokenProvider.generateAccessToken(username, userId, deptId, role);

        return new RefreshResponse(newAccessToken);
    }

    public void logout(RefreshRequest request) {
        refreshTokenStore.remove(request.refreshToken());
    }
}

