-- =============================================================================
-- KUPUB 완전 초기화 스크립트 (프로덕션 배포 전 사용)
-- 주의: 이 스크립트는 모든 데이터를 삭제하고 기본 admin 계정만 남깁니다!
-- 사용법: docker exec -i mysql mysql -ukupub -pmy-strong-password kupub < full-reset.sql
-- =============================================================================

-- 외래키 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 모든 테이블 데이터 삭제
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE guest_sessions;
TRUNCATE TABLE reservations;
TRUNCATE TABLE menus;
TRUNCATE TABLE menu_categories;
TRUNCATE TABLE department_tables;
TRUNCATE TABLE department_media;
TRUNCATE TABLE department_settings;
TRUNCATE TABLE departments;
TRUNCATE TABLE users;

-- 외래키 체크 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 기본 admin 계정 생성 (비밀번호: admin123 - BCrypt 해시)
-- 프로덕션에서는 반드시 비밀번호를 변경하세요!
INSERT INTO users (username, password, role, enabled, created_at)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E0', 'SUPER_ADMIN', TRUE, NOW());

-- 완료 메시지
SELECT 'Database has been fully reset!' AS result;
SELECT 'Default admin account created (username: admin, password: admin123)' AS note;
SELECT 'IMPORTANT: Change the admin password immediately!' AS warning;

