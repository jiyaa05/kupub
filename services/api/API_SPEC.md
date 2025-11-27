# KUPUB API Specification

> 멀티 학과 주점/행사 운영 플랫폼 API 문서  
> Base URL: `https://api.kupub.shop` (Production) / `http://localhost:8080` (Local)

---

## 📌 목차

1. [공통 사항](#1-공통-사항)
2. [인증 API](#2-인증-api)
3. [학과 설정 API](#3-학과-설정-api)
4. [메뉴 API](#4-메뉴-api)
5. [예약 API](#5-예약-api)
6. [세션 API](#6-세션-api)
7. [테이블 API](#7-테이블-api)
8. [주문 API](#8-주문-api)
9. [플랫폼 API](#9-플랫폼-api)

---

## 1. 공통 사항

### 1.1 응답 형식

모든 API는 동일한 형식으로 응답합니다.

**성공:**
```json
{
  "data": { ... },
  "error": null
}
```

**실패:**
```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 1.2 에러 코드

| HTTP | Code | 설명 |
|------|------|------|
| 400 | `BAD_REQUEST` | 잘못된 요청 |
| 400 | `VALIDATION_FAILED` | 입력값 검증 실패 |
| 400 | `SLOT_CLOSED` | 예약 시간대 마감 |
| 401 | `UNAUTHORIZED` | 인증 필요 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

### 1.3 인증

관리자 API는 JWT 토큰이 필요합니다.

```
Authorization: Bearer {accessToken}
```

### 1.4 역할 (Role)

| Role | 설명 |
|------|------|
| `SUPER_ADMIN` | 플랫폼 전체 관리자 |
| `DEPT_ADMIN` | 학과 관리자 |
| `STAFF` | 스태프 (예정) |

---

## 2. 인증 API

### 2.1 로그인

```
POST /api/auth/login
```

**Request:**
```json
{
  "username": "admin",
  "password": "password123",
  "departmentSlug": "cs"    // 선택
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "username": "admin",
    "departmentId": 1,
    "departmentSlug": "cs",
    "role": "DEPT_ADMIN"
  }
}
```

### 2.2 토큰 갱신

```
POST /api/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbG..."
  }
}
```

### 2.3 로그아웃

```
POST /api/auth/logout
```

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

---

## 3. 학과 설정 API

### 3.1 설정 조회 (Public)

```
GET /api/{dept}/settings
```

**Response:**
```json
{
  "data": {
    "department": {
      "id": 1,
      "slug": "cs",
      "name": "컴퓨터공학과",
      "active": true
    },
    "settings": {
      "branding": {
        "primaryColor": "#E3A94B",
        "logoUrl": "/uploads/logo.png"
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
        "accountNumber": "1234-5678-9012",
        "accountHolder": "홍길동"
      },
      "pricing": {
        "tableFee": 4000,
        "corkage": 5000,
        "discounts": [
          { "label": "정보대학 할인", "amount": -10000, "condition": "info" }
        ]
      },
      "onboarding": [
        {
          "id": "1",
          "imageUrl": "/images/slide1.png",
          "title": "조용한 주점",
          "body": "컴퓨터학과는 조용합니다.",
          "order": 0
        }
      ],
      "reservationClosed": ["2025-11-12T18:00:00"]
    }
  }
}
```

---

## 4. 메뉴 API

### 4.1 메뉴 조회 (Public)

```
GET /api/{dept}/menus
```

**Response:**
```json
{
  "data": {
    "department": {
      "id": 1,
      "slug": "cs",
      "name": "컴퓨터공학과"
    },
    "categories": [
      { "id": 1, "name": "안주", "displayOrder": 0 },
      { "id": 2, "name": "주류", "displayOrder": 1 }
    ],
    "menus": [
      {
        "id": 1,
        "categoryId": 1,
        "name": "치즈볼",
        "price": 5000,
        "description": "바삭한 치즈볼",
        "imageUrl": "/uploads/cheese.jpg",
        "displayOrder": 0,
        "soldOut": false
      }
    ]
  }
}
```

---

## 5. 예약 API

### 5.1 예약 생성 (Public)

```
POST /api/{dept}/reservations
```

**Request:**
```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "reservationTime": "2025-11-12T18:00:00",
  "people": 4
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "departmentId": 1,
    "name": "홍길동",
    "phone": "010-1234-5678",
    "reservationTime": "2025-11-12T18:00:00",
    "people": 4,
    "status": "WAITING",
    "tableId": null,
    "createdAt": "2025-11-12T10:00:00"
  }
}
```

**에러 (마감된 시간대):**
```json
{
  "data": null,
  "error": {
    "code": "SLOT_CLOSED",
    "message": "this time slot is closed"
  }
}
```

---

## 6. 세션 API

> 손님의 "세션"을 관리합니다.  
> 세션 타입: `RESERVATION` (예약), `QR` (QR 스캔), `CODE` (코드 입력)

### 6.1 세션 시작 (Public)

```
POST /api/{dept}/sessions/start
```

**Request (예약으로 시작):**
```json
{
  "type": "RESERVATION",
  "reservationId": 1
}
```

**Request (QR로 시작):**
```json
{
  "type": "QR",
  "tableId": 5,
  "guestName": "홍길동",
  "people": 3
}
```

**Request (코드로 시작):**
```json
{
  "type": "CODE",
  "sessionCode": "ABC123",
  "guestName": "홍길동"
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "departmentId": 1,
    "type": "RESERVATION",
    "reservationId": 1,
    "tableId": null,
    "tableCode": null,
    "sessionCode": null,
    "guestName": "홍길동",
    "people": 4,
    "status": "ACTIVE",
    "createdAt": "2025-11-12T18:00:00"
  }
}
```

### 6.2 세션 조회 (Public)

```
GET /api/{dept}/sessions/{id}
```

### 6.3 코드로 세션 조회 (Public)

```
GET /api/{dept}/sessions/code/{code}
```

### 6.4 활성 세션 목록 (Admin)

```
GET /api/{dept}/admin/sessions
GET /api/{dept}/admin/sessions?all=true   // 전체 (종료 포함)
```

### 6.5 테이블 배정 (Admin)

```
PATCH /api/{dept}/admin/sessions/{id}/assign-table
```

**Request:**
```json
{
  "tableId": 5
}
```

### 6.6 세션 종료 (Admin)

```
PATCH /api/{dept}/admin/sessions/{id}/close
```

---

## 7. 테이블 API

> 학과별 테이블 관리 (관리자용)

### 7.1 테이블 목록

```
GET /api/{dept}/admin/tables
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "departmentId": 1,
      "code": "T1",
      "name": "창가 테이블",
      "capacity": 4,
      "posX": 100,
      "posY": 50,
      "width": 80,
      "height": 80,
      "active": true
    }
  ]
}
```

### 7.2 테이블 생성

```
POST /api/{dept}/admin/tables
```

**Request:**
```json
{
  "code": "T1",
  "name": "창가 테이블",
  "capacity": 4,
  "posX": 100,
  "posY": 50,
  "width": 80,
  "height": 80
}
```

### 7.3 테이블 수정

```
PATCH /api/{dept}/admin/tables/{id}
```

**Request:**
```json
{
  "name": "VIP 테이블",
  "capacity": 6,
  "active": true
}
```

### 7.4 테이블 삭제

```
DELETE /api/{dept}/admin/tables/{id}
```

### 7.5 레이아웃 일괄 저장

```
PUT /api/{dept}/admin/tables/layout
```

**Request:**
```json
{
  "tables": [
    { "id": 1, "posX": 100, "posY": 50, "width": 80, "height": 80 },
    { "id": 2, "posX": 200, "posY": 50, "width": 80, "height": 80 }
  ]
}
```

---

## 8. 주문 API

### 8.1 주문 생성 (Public)

```
POST /api/{dept}/orders
```

**Request:**
```json
{
  "sessionId": 1,
  "note": "덜 맵게 해주세요",
  "discountCode": "info",
  "items": [
    { "menuId": 1, "quantity": 2 },
    { "name": "수기메뉴", "price": 12000, "quantity": 1 }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "departmentId": 1,
    "sessionId": 1,
    "tableId": 5,
    "tableCode": "T1",
    "subtotal": 22000,
    "tableFee": 4000,
    "corkage": 5000,
    "discount": -10000,
    "totalPrice": 21000,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "note": "덜 맵게 해주세요",
    "items": [
      { "id": 1, "menuId": 1, "name": "치즈볼", "price": 5000, "quantity": 2, "subtotal": 10000 },
      { "id": 2, "menuId": null, "name": "수기메뉴", "price": 12000, "quantity": 1, "subtotal": 12000 }
    ],
    "createdAt": "2025-11-12T18:30:00"
  }
}
```

### 8.2 주문 목록 (Admin)

```
GET /api/{dept}/admin/orders
GET /api/{dept}/admin/orders?status=PREPARING
```

### 8.3 주문 상태 변경 (Admin)

```
PATCH /api/{dept}/admin/orders/{id}
```

**Request:**
```json
{
  "status": "PREPARING",
  "paymentStatus": "CONFIRMED"
}
```

### 8.4 상태 값

| OrderStatus | 설명 |
|-------------|------|
| `PENDING` | 대기 중 |
| `PREPARING` | 준비 중 |
| `DONE` | 완료 |
| `CANCELLED` | 취소 |

| PaymentStatus | 설명 |
|---------------|------|
| `PENDING` | 결제 대기 |
| `CONFIRMED` | 결제 확인됨 |
| `FAILED` | 결제 실패 |
| `NOT_REQUIRED` | 결제 불필요 |

---

## 9. 플랫폼 API

> 플랫폼 관리자 전용 (SUPER_ADMIN)

### 9.1 학과 목록

```
GET /api/platform/departments
```

### 9.2 학과 생성

```
POST /api/platform/departments
```

**Request:**
```json
{
  "slug": "design",
  "name": "디자인학과"
}
```

### 9.3 학과 관리자 계정 생성

```
POST /api/platform/departments/create-admin
```

**Request:**
```json
{
  "departmentId": 1,
  "username": "cs-admin",
  "password": "secret1234"
}
```

---

## 📝 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v2.0 | 2025-11-26 | 테이블, 세션, 가격 계산 추가. 패키지 구조 리팩토링 |
| v1.0 | 2025-11-12 | 초기 버전 |
