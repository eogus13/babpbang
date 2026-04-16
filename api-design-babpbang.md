# 밥빵 API 설계서

> 촬영현장 식사 조율 앱 — API 엔드포인트 문서

---

## 공통 응답 형식

모든 API는 아래 형식을 따른다.

```json
// 성공
{ "success": true, "data": { ... }, "message": "..." }

// 실패
{ "success": false, "error": "에러 메시지" }
```

---

## API 엔드포인트 목록

### 👤 사용자

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/users` | 온보딩 — 이름/팀 등록 (없으면 생성, 있으면 업데이트) |
| `GET`  | `/api/users?deviceId=xxx` | 현재 사용자 정보 조회 |

### 🍽️ 밥약속 방

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/rooms` | 새 밥약속 방 생성 |
| `GET`  | `/api/rooms?code=A3F-92X` | 초대 코드로 방 정보 조회 |

### 🙋 참여 여부

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST`  | `/api/rooms/[id]/attendance` | 초대 링크로 방 입장 (PENDING 상태로 등록) |
| `PATCH` | `/api/rooms/[id]/attendance` | 참여 여부 응답 (JOIN / SKIP) |

### 📍 식당 추천

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/restaurants/nearby?lat=&lng=&maxMinutes=10&category=` | 근처 식당 목록 (위치 기반) |
| `GET` | `/api/restaurants/[id]` | 식당 상세 + 메뉴 목록 |

### 🗳️ 식당 투표 (투표 모드 전용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET`    | `/api/rooms/[id]/restaurant-vote` | 투표 현황 조회 (식당별 득표 수) |
| `POST`   | `/api/rooms/[id]/restaurant-vote` | 식당에 투표 (이미 투표했으면 변경) |
| `DELETE` | `/api/rooms/[id]/restaurant-vote?userId=` | 투표 취소 |

### 👑 식당 확정

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/rooms/[id]/confirm-restaurant` | 식당 확정 (투표 마감 or 리더 직접 선택) |

### 🍜 메뉴 선택

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET`  | `/api/rooms/[id]/menu-selection` | 메뉴 선택 현황 (팀원별 선택 메뉴) |
| `POST` | `/api/rooms/[id]/menu-selection` | 메뉴 선택 (여러 개 동시 가능) |

### 🎉 최종 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/rooms/[id]/summary` | 최종 요약 (식당 + 팀원별 메뉴 + 총 금액) |

---

## 화면별 API 호출 흐름

```
[온보딩]
  POST /api/users
      ↓
[홈 화면 — 새 방 만들기]
  POST /api/rooms
      ↓
[초대 링크 공유]
  (초대 코드 = room.code)
      ↓
[참여자 — 초대 링크 클릭]
  GET  /api/rooms?code=A3F-92X  ← 방 정보 확인
  POST /api/rooms/[id]/attendance  ← 방 입장
      ↓
[참여 여부 투표]
  PATCH /api/rooms/[id]/attendance  (JOIN or SKIP)
      ↓
[식당 추천 목록]
  GET /api/restaurants/nearby?lat=&lng=&maxMinutes=10
      ↓
  ┌── [투표 모드] ────────────────────────────────────┐
  │  GET  /api/rooms/[id]/restaurant-vote  ← 실시간 현황
  │  POST /api/rooms/[id]/restaurant-vote  ← 투표
  │  POST /api/rooms/[id]/confirm-restaurant  ← 리더가 마감
  └───────────────────────────────────────────────────┘
  ┌── [리더 선택 모드] ────────────────────────────────┐
  │  POST /api/rooms/[id]/confirm-restaurant  ← 리더가 확정
  └───────────────────────────────────────────────────┘
      ↓
[메뉴 선택]
  GET  /api/rooms/[id]/menu-selection  ← 실시간 현황
  POST /api/rooms/[id]/menu-selection  ← 내 메뉴 선택
      ↓
[최종 요약]
  GET /api/rooms/[id]/summary
```

---

## 생성된 파일 구조

```
app/
└── api/
    ├── users/
    │   └── route.ts              # POST, GET
    ├── rooms/
    │   ├── route.ts              # POST (생성), GET (코드로 조회)
    │   └── [id]/
    │       ├── attendance/
    │       │   └── route.ts      # POST (입장), PATCH (참여 여부)
    │       ├── restaurant-vote/
    │       │   └── route.ts      # GET, POST, DELETE
    │       ├── confirm-restaurant/
    │       │   └── route.ts      # POST
    │       ├── menu-selection/
    │       │   └── route.ts      # GET, POST
    │       └── summary/
    │           └── route.ts      # GET
    └── restaurants/
        ├── nearby/
        │   └── route.ts          # GET (위치 기반 조회)
        └── [id]/
            └── route.ts          # GET (식당 상세)

lib/
├── api.ts                        # 클라이언트 API 호출 함수 모음
└── db.ts                         # Prisma DB 연결

types/
└── api.ts                        # TypeScript 타입 정의
```

---

## Room 상태 전환 로직

| 상태 | 전환 조건 | 다음 상태 |
|------|-----------|-----------|
| `WAITING_ATTENDANCE` | 전원 응답 완료 + 1명 이상 JOIN | `SELECTING_RESTAURANT` |
| `SELECTING_RESTAURANT` | 리더가 식당 확정 | `RESTAURANT_CONFIRMED` |
| `RESTAURANT_CONFIRMED` | 전원 메뉴 선택 완료 | `COMPLETED` |

---

*밥빵 API 설계서 v1.0 | 2026-04-17*
