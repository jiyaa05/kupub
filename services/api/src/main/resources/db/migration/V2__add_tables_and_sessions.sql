-- ============================================================================
-- KUPUB Database Migration V2
-- 테이블 관리 + 손님 세션 + 주문 확장
-- ============================================================================

-- 1. department_tables: 테이블 관리
CREATE TABLE IF NOT EXISTS department_tables (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(50),
    capacity INT,
    pos_x INT,
    pos_y INT,
    width INT,
    height INT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_dept_table_code (department_id, code),
    INDEX idx_dept_tables_dept (department_id)
);

-- 2. guest_sessions: 손님 세션 (예약/QR/코드)
CREATE TABLE IF NOT EXISTS guest_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,  -- RESERVATION, QR, CODE
    reservation_id BIGINT,
    table_id BIGINT,
    session_code VARCHAR(20),
    guest_name VARCHAR(50),
    guest_phone VARCHAR(20),
    people INT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, CLOSED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    
    INDEX idx_sessions_dept (department_id),
    INDEX idx_sessions_reservation (reservation_id),
    INDEX idx_sessions_table (table_id),
    INDEX idx_sessions_code (department_id, session_code)
);

-- 3. orders 테이블 확장 (새 컬럼 추가)
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS session_id BIGINT AFTER department_id,
    ADD COLUMN IF NOT EXISTS table_id BIGINT AFTER session_id,
    ADD COLUMN IF NOT EXISTS subtotal INT NOT NULL DEFAULT 0 AFTER reservation_id,
    ADD COLUMN IF NOT EXISTS table_fee INT DEFAULT 0 AFTER subtotal,
    ADD COLUMN IF NOT EXISTS corkage INT DEFAULT 0 AFTER table_fee,
    ADD COLUMN IF NOT EXISTS discount INT DEFAULT 0 AFTER corkage,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER status,
    ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 기존 total_price 데이터를 subtotal로 복사 (기존 데이터 보존)
UPDATE orders SET subtotal = total_price WHERE subtotal = 0 AND total_price > 0;

-- 4. reservations 테이블 확장
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS table_id BIGINT AFTER status;

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);

