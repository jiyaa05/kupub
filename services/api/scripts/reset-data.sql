-- =============================================================================
-- KUPUB 테스트 데이터 초기화 스크립트
-- 주의: 이 스크립트는 모든 비즈니스 데이터를 삭제합니다!
-- 사용법: docker exec -i mysql mysql -ukupub -pmy-strong-password kupub < reset-data.sql
-- =============================================================================

-- 외래키 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 주문 관련 데이터 삭제
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;

-- 2. 세션/예약 데이터 삭제
TRUNCATE TABLE guest_sessions;
TRUNCATE TABLE reservations;

-- 3. 메뉴 데이터 삭제
TRUNCATE TABLE menus;
TRUNCATE TABLE menu_categories;

-- 4. 테이블 데이터 삭제
TRUNCATE TABLE department_tables;

-- 5. 미디어 데이터 삭제
TRUNCATE TABLE department_media;

-- 6. 학과 설정은 유지하되 데이터만 초기화 (선택적)
-- TRUNCATE TABLE department_settings;

-- 외래키 체크 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 완료 메시지
SELECT 'All test data has been cleared!' AS result;
SELECT 'Remaining: departments, department_settings, users' AS note;

