package com.kupub.api.config;

import com.kupub.api.user.entity.User;
import com.kupub.api.user.entity.UserRole;
import com.kupub.api.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {
    
    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public void run(String... args) {
        // admin 계정이 없거나 비밀번호 업데이트 필요한 경우
        userRepository.findByUsername("admin").ifPresentOrElse(
            user -> {
                // 비밀번호 업데이트
                user.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(user);
                log.info("Admin password updated");
            },
            () -> {
                // 새로 생성
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(UserRole.SUPER_ADMIN);
                userRepository.save(admin);
                log.info("Admin account created");
            }
        );
        
        // cs_admin 계정
        userRepository.findByUsername("cs_admin").ifPresentOrElse(
            user -> {
                user.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(user);
                log.info("cs_admin password updated");
            },
            () -> {
                User csAdmin = new User();
                csAdmin.setUsername("cs_admin");
                csAdmin.setPassword(passwordEncoder.encode("admin123"));
                csAdmin.setDepartmentId(1L);
                csAdmin.setRole(UserRole.DEPT_ADMIN);
                userRepository.save(csAdmin);
                log.info("cs_admin account created");
            }
        );
    }
}

