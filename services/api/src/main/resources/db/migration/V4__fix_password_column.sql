-- Fix password column: 중복 컬럼 정리
-- password_hash 컬럼이 있으면 데이터를 password로 복사하고 제거

-- 1. password가 비어있으면 password_hash 값으로 채움
UPDATE users SET password = COALESCE(NULLIF(password, ''), password_hash) 
WHERE password IS NULL OR password = '';

-- 2. password_hash 컬럼 제거 (존재하는 경우)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'users' 
               AND COLUMN_NAME = 'password_hash');

SET @query := IF(@exist > 0, 'ALTER TABLE users DROP COLUMN password_hash', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

