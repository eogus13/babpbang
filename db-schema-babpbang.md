# 밥빵 DB 설계서

> 촬영현장 식사 조율 앱 — 데이터베이스 스키마

---

## 기술 스택

- **ORM:** Prisma
- **DB:** PostgreSQL
- **무료 호스팅 추천:** [Supabase](https://supabase.com) (무료 tier 충분)

---

## 테이블 목록

| 테이블 | 역할 | 핵심 필드 |
|--------|------|-----------|
| `User` | 앱 사용자 | deviceId, name, team |
| `Room` | 밥약속 방 | code, leaderId, selectionMode, status |
| `RoomMember` | 방 참여자 + 참여 여부 | roomId, userId, attendance |
| `Restaurant` | 식당 정보 | name, category, lat, lng |
| `Menu` | 식당별 메뉴 | restaurantId, name, price |
| `RestaurantVote` | 식당 투표 (투표 모드) | roomId, userId, restaurantId |
| `MenuSelection` | 각자 선택한 메뉴 | roomId, userId, menuId |

---

## ERD (관계도)

```
User ──────< RoomMember >────── Room
              (참여 여부)         │
                                 │ selectionMode
                              VOTE │ LEADER
                                 │
User ──────< RestaurantVote >──── Room
              (식당 투표)          └──── Restaurant
                                              │
User ──────< MenuSelection >──────────────── Menu
              (메뉴 선택)
```

---

## 테이블 상세

### User (사용자)

로그인 없이 디바이스 ID로 식별. 앱 첫 실행 시 이름/팀 입력.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | 고유 ID |
| deviceId | String (unique) | 디바이스 ID (로그인 대체) |
| name | String | 이름 (예: 홍길동) |
| team | String | 소속 팀 (예: 조명팀) |
| createdAt | DateTime | 가입일 |

---

### Room (밥약속 방)

리더가 만들고 초대 코드로 팀원을 불러들이는 핵심 테이블.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | 고유 ID |
| code | String (unique) | 초대 코드 (예: A3F-92X) |
| leaderId | String | 방장 User ID |
| mealTime | DateTime | 식사 예정 시간 |
| selectionMode | Enum | **VOTE** (투표) / **LEADER** (직접 선택) |
| status | Enum | 진행 상태 (아래 참고) |
| maxWalkMinutes | Int | 도보 이동 거리 (기본 10분) |
| lat / lng | Float? | 현재 위치 (식당 추천용) |
| confirmedRestaurantId | String? | 확정된 식당 ID |

**Room 상태 흐름:**
```
WAITING_ATTENDANCE     참여 여부 투표 대기 중
       ↓
SELECTING_RESTAURANT   식당 선정 중 (투표 or 리더 선택)
       ↓
RESTAURANT_CONFIRMED   식당 확정, 각자 메뉴 선택 중
       ↓
COMPLETED              모든 팀원 메뉴 선택 완료
```

---

### RoomMember (방 참여자)

초대 링크를 클릭한 팀원 + 참여 여부 응답.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | 고유 ID |
| roomId | String | 어떤 방인지 |
| userId | String | 누구인지 |
| attendance | Enum | **PENDING** / **JOIN** (먹을게요!) / **SKIP** (패스) |
| joinedAt | DateTime? | 참여 확정 시각 |

> 제약: `(roomId, userId)` 복합 유니크 — 같은 방에 같은 사람 중복 초대 불가

---

### Restaurant (식당)

카카오맵 / 네이버 Place API에서 가져오거나 직접 등록.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | 고유 ID |
| externalId | String? | 카카오/네이버 플레이스 ID |
| name | String | 식당 이름 |
| category | String | 한식, 중식, 양식, 분식, 일식... |
| address | String | 주소 |
| lat / lng | Float | 좌표 (거리 계산용) |
| phone | String? | 전화번호 |
| businessHours | String? | 영업시간 |
| rating | Float | 평균 별점 |
| isActive | Boolean | 활성 여부 (폐업 식당 숨기기) |

---

### Menu (메뉴)

식당별 메뉴 항목. 팀원들이 각자 고를 수 있는 항목들.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | 고유 ID |
| restaurantId | String | 어떤 식당 메뉴인지 |
| name | String | 메뉴 이름 (예: 삼겹살 1인분) |
| price | Int | 가격 (원) |
| menuCategory | String? | 메뉴 분류 (예: 고기류, 찌개류) |
| isAvailable | Boolean | 품절/일시 중단 여부 |

---

### RestaurantVote (식당 투표)

`selectionMode = VOTE`일 때만 사용. 한 명이 한 식당에만 투표 가능.

| 필드 | 타입 | 설명 |
|------|------|------|
| roomId | String | 어떤 방의 투표인지 |
| userId | String | 누가 투표했는지 |
| restaurantId | String | 어떤 식당에 투표했는지 |

> 제약: `(roomId, userId)` 복합 유니크 — 같은 방에서 한 명이 한 표만

> 식당 변경 시: 기존 레코드 삭제 후 새로 생성 (Upsert 사용)

---

### MenuSelection (메뉴 선택)

식당 확정 후 각 팀원이 고른 메뉴. 여러 메뉴 선택 가능(예: 삼겹살 + 된장찌개).

| 필드 | 타입 | 설명 |
|------|------|------|
| roomId | String | 어떤 방의 선택인지 |
| userId | String | 누가 선택했는지 |
| menuId | String | 어떤 메뉴를 선택했는지 |

> 제약: `(roomId, userId, menuId)` 복합 유니크 — 같은 메뉴 중복 선택 불가

---

## 설치 및 세팅 방법

```bash
# 1. Prisma 설치
npm install prisma @prisma/client

# 2. Prisma 초기화 (처음 한 번만)
npx prisma init

# 3. schema.prisma 파일을 prisma/ 폴더에 복사

# 4. .env.local 파일에 DB 주소 추가
# (Supabase 사용 시 대시보드 → Settings → Database → Connection string 복사)
DATABASE_URL="postgresql://[user]:[password]@[host]:5432/babpbang_db?pgbouncer=true"
DIRECT_URL="postgresql://[user]:[password]@[host]:5432/babpbang_db"

# 5. DB에 테이블 생성
npx prisma db push

# 6. Prisma Studio로 데이터 직접 확인 (개발할 때 편리!)
npx prisma studio
```

---

## MVP 테이블 우선순위

처음부터 모든 테이블을 만들기 부담스러우면 이 순서로:

**1단계 (핵심):** `User` + `Room` + `RoomMember`
→ 방 만들기, 초대, 참여 여부까지 가능

**2단계 (식당):** `Restaurant` + `Menu`
→ 식당 추천 + 메뉴 표시 가능

**3단계 (투표/선택):** `RestaurantVote` + `MenuSelection`
→ 투표 모드 + 최종 메뉴 선택 완성

---

*밥빵 DB 설계서 v1.0 | 2026-04-17*
