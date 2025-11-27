-- KUPUB 珥덇린 ?곗씠??(H2 媛쒕컻??

-- ?숆낵
INSERT INTO departments (id, slug, name, active, created_at, updated_at) VALUES 
(1, 'cs', '而댄벂?곌났?숆낵', true, NOW(), NOW());

-- ?숆낵 ?ㅼ젙
INSERT INTO department_settings (id, department_id, data_json, created_at, updated_at) VALUES 
(1, 1, '{
  "branding": {
    "primaryColor": "#E3A94B",
    "logoUrl": null
  },
  "flow": {
    "entryModes": ["reservation"],
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
    "bankName": "?좎뒪諭낇겕",
    "accountNumber": "1000-1234-5678",
    "accountHolder": "而닿났二쇱젏"
  },
  "pricing": {
    "tableFee": 4000,
    "corkage": 5000,
    "discounts": [
      {"label": "?뺣낫????좎씤", "amount": -10000, "condition": "info"}
    ]
  },
  "onboarding": [
    {
      "id": "1",
      "imageUrl": null,
      "title": "?섏쁺?⑸땲??",
      "body": "而댄벂?곌났?숆낵 二쇱젏???ㅼ떊 寃껋쓣 ?섏쁺?⑸땲??",
      "order": 0
    },
    {
      "id": "2",
      "imageUrl": null,
      "title": "?덉빟 ?덈궡",
      "body": "?먰솢???댁쁺???꾪빐 ?덉빟 ??諛⑸Ц?댁＜?몄슂.",
      "order": 1
    }
  ],
  "reservationClosed": []
}', NOW(), NOW());

-- 硫붾돱 移댄뀒怨좊━
INSERT INTO menu_categories (id, department_id, name, display_order) VALUES 
(1, 1, '?덉＜', 0),
(2, 1, '二쇰쪟', 1),
(3, 1, '?뚮즺', 2);

-- 硫붾돱 ?꾩씠??
INSERT INTO menus (id, department_id, category_id, name, price, description, image_url, display_order, sold_out, created_at) VALUES 
(1, 1, 1, '移섏쫰蹂?, 5000, '諛붿궘?섍퀬 已꾧퉫??移섏쫰蹂?, null, 0, false, NOW()),
(2, 1, 1, '媛먯옄?源', 4000, '諛붿궘??媛먯옄?源', null, 1, false, NOW()),
(3, 1, 1, '?〓낭??, 6000, '留ㅼ숴?ъ숴 ?〓낭??, null, 2, false, NOW()),
(4, 1, 1, '?뚯꽭吏 ?쇱콈蹂띠쓬', 8000, '?뚯꽭吏? ?쇱콈???섏긽 議고빀', null, 3, false, NOW()),
(5, 1, 2, '李몄씠??, 5000, '援?? ?뚯＜', null, 0, false, NOW()),
(6, 1, 2, '移댁뒪', 5000, '?쒖썝??留μ＜', null, 1, false, NOW()),
(7, 1, 2, '?섏씠蹂?, 7000, '?꾩뒪???섏씠蹂?, null, 2, false, NOW()),
(8, 1, 3, '肄쒕씪', 2000, '肄붿뭅肄쒕씪 500ml', null, 0, false, NOW()),
(9, 1, 3, '?ъ씠??, 2000, '移좎꽦?ъ씠??500ml', null, 1, false, NOW());

-- ?뚯씠釉?(而щ읆紐? posx, posy - Hibernate naming strategy)
INSERT INTO department_tables (id, department_id, code, name, capacity, posx, posy, width, height, active, created_at, updated_at) VALUES 
(1, 1, 'A1', 'Table A1', 4, 50, 50, 80, 80, true, NOW(), NOW()),
(2, 1, 'A2', 'Table A2', 4, 150, 50, 80, 80, true, NOW(), NOW()),
(3, 1, 'B1', 'Table B1', 6, 50, 150, 100, 80, true, NOW(), NOW()),
(4, 1, 'B2', 'Table B2', 6, 170, 150, 100, 80, true, NOW(), NOW());

-- 愿由ъ옄 怨꾩젙 (password: admin123 - bcrypt)
INSERT INTO users (id, department_id, username, password, role, enabled, created_at) VALUES 
(1, 1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4M0lVpDsb4PaOqTqFqM0tqsWzH.e', 'DEPT_ADMIN', TRUE, NOW());
