-- password_hash 컬럼 제거 (MySQL 호환)
-- password 컬럼에 데이터 복사 후 password_hash 제거

-- 1. password가 비어있거나 NULL이면 password_hash 값으로 업데이트
UPDATE users 
SET password = password_hash 
WHERE (password IS NULL OR password = '') AND password_hash IS NOT NULL;

-- 2. password_hash 컬럼 삭제
ALTER TABLE users DROP COLUMN password_hash;

