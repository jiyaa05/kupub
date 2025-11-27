-- ============================================================================
-- KUPUB Database Migration V1
-- 초기 스키마 (이미 존재하면 무시)
-- ============================================================================

-- departments
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- department_settings
CREATE TABLE IF NOT EXISTS department_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL UNIQUE,
    data_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department_id BIGINT,
    role VARCHAR(20) NOT NULL DEFAULT 'DEPT_ADMIN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- menu_categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT,
    INDEX idx_categories_dept (department_id)
);

-- menus
CREATE TABLE IF NOT EXISTS menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    category_id BIGINT,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    description VARCHAR(500),
    image_url VARCHAR(255),
    display_order INT,
    sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_menus_dept (department_id),
    INDEX idx_menus_category (category_id)
);

-- reservations
CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    reservation_time DATETIME NOT NULL,
    people INT,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    requeued_at DATETIME,
    seated_at DATETIME,
    finished_at DATETIME,
    INDEX idx_reservations_dept (department_id),
    INDEX idx_reservations_status (status)
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT NOT NULL,
    reservation_id BIGINT,
    total_price INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    note VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_orders_dept (department_id),
    INDEX idx_orders_reservation (reservation_id)
);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_id BIGINT,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    quantity INT NOT NULL,
    INDEX idx_items_order (order_id)
);

-- department_media
CREATE TABLE IF NOT EXISTS department_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_id BIGINT,
    url VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50),
    built_in BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

