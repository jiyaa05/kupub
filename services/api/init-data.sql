-- KUPUB 초기 데이터 (MySQL용)
-- MySQL 클라이언트에서 실행: mysql -u kupub -p kupub < init-data.sql

-- 학과
INSERT INTO departments (slug, name, active, created_at, updated_at) VALUES 
('cs', '컴퓨터공학과', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 학과 설정 (department_id = 1이라고 가정)
INSERT INTO department_settings (department_id, data_json, created_at, updated_at) VALUES 
(1, '{
  "branding": {
    "primaryColor": "#E3A94B",
    "logoUrl": null
  },
  "flow": {
    "entryModes": ["reservation", "qr", "code"],
    "showOnboarding": true,
    "requireReservationForFirstOrder": true,
    "allowAdditionalOrder": true,
    "showPaymentPage": true
  },
  "reservation": {
    "startTime": "18:00",
    "endTime": "00:30",
    "intervalMinutes": 30,
    "durationMinutes": 60,
    "maxPeople": 6
  },
  "payment": {
    "method": "transfer",
    "bankName": "토스뱅크",
    "accountNumber": "1000-1234-5678",
    "accountHolder": "컴공주점"
  },
  "pricing": {
    "tableFee": 4000,
    "corkage": 5000,
    "discounts": [
      {"label": "정보대학 할인", "amount": -10000, "condition": "info"}
    ]
  },
  "onboarding": [
    {
      "id": "1",
      "imageUrl": null,
      "title": "환영합니다!",
      "body": "컴퓨터공학과 주점에 오신 것을 환영합니다.",
      "order": 0
    }
  ],
  "reservationClosed": []
}', NOW(), NOW())
ON DUPLICATE KEY UPDATE data_json = VALUES(data_json);

-- 메뉴 카테고리
INSERT INTO menu_categories (department_id, name, display_order) VALUES 
(1, '안주', 0),
(1, '주류', 1),
(1, '음료', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 메뉴 아이템
INSERT INTO menus (department_id, category_id, name, price, description, display_order, sold_out, created_at) VALUES 
(1, 1, '치즈볼', 5000, '바삭하고 쫄깃한 치즈볼', 0, false, NOW()),
(1, 1, '감자튀김', 4000, '바삭한 감자튀김', 1, false, NOW()),
(1, 1, '떡볶이', 6000, '매콤달콤 떡볶이', 2, false, NOW()),
(1, 2, '참이슬', 5000, '국민 소주', 0, false, NOW()),
(1, 2, '카스', 5000, '시원한 맥주', 1, false, NOW()),
(1, 3, '콜라', 2000, '코카콜라', 0, false, NOW()),
(1, 3, '사이다', 2000, '칠성사이다', 1, false, NOW());

-- 테이블
INSERT INTO department_tables (department_id, code, name, capacity, posx, posy, width, height, active, created_at, updated_at) VALUES 
(1, 'A1', '테이블 A1', 4, 50, 50, 80, 80, true, NOW(), NOW()),
(1, 'A2', '테이블 A2', 4, 150, 50, 80, 80, true, NOW(), NOW()),
(1, 'B1', '테이블 B1', 6, 50, 150, 100, 80, true, NOW(), NOW());

SELECT '데이터 입력 완료!' as result;

