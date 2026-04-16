# 🍚 밥빵 (BabPbang)

> 촬영현장 밥시간 조율앱 — 함께 먹을지 정하고, 식당 고르고, 메뉴까지 한번에!

---

## 프로젝트 구조

```
babpbang/
├── app/                          # Next.js 페이지
│   ├── layout.tsx                # 공통 레이아웃
│   ├── page.tsx                  # 홈 화면
│   ├── globals.css               # 전역 스타일
│   ├── onboarding/page.tsx       # 이름/팀 입력
│   ├── room/
│   │   ├── new/page.tsx          # 밥약속 만들기
│   │   └── [id]/
│   │       ├── invite/page.tsx   # 초대 공유
│   │       ├── vote/page.tsx     # 참여 여부 투표
│   │       ├── restaurants/page.tsx  # 식당 추천
│   │       ├── menu/page.tsx     # 메뉴 선택
│   │       └── summary/page.tsx  # 최종 요약
│   ├── restaurant/[id]/page.tsx  # 식당 상세 (투표/리더 모드)
│   └── api/                      # API Routes
│       ├── users/route.ts
│       ├── rooms/route.ts
│       ├── rooms/[id]/attendance/route.ts
│       ├── rooms/[id]/restaurant-vote/route.ts
│       ├── rooms/[id]/confirm-restaurant/route.ts
│       ├── rooms/[id]/menu-selection/route.ts
│       ├── rooms/[id]/summary/route.ts
│       └── restaurants/nearby/route.ts
├── contexts/
│   └── UserContext.tsx            # 사용자 상태 전역 관리
├── lib/
│   ├── api.ts                    # 클라이언트 API 호출 함수
│   └── db.ts                     # Prisma DB 연결
├── types/
│   └── api.ts                    # TypeScript 타입 정의
└── prisma/
    └── schema.prisma             # DB 스키마
```

---

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
# .env.local 파일을 열어서 실제 값 입력
```

필요한 값:
- `DATABASE_URL` — Supabase 또는 다른 PostgreSQL DB 주소
- `NEXT_PUBLIC_KAKAO_MAP_KEY` — 카카오 지도 API 키

### 3. DB 세팅

```bash
npm run db:push      # 테이블 생성
npm run db:studio    # DB 데이터 GUI로 확인 (선택)
```

### 4. 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000 에서 확인!

---

## 주의사항

- `.env.local` 파일은 절대 git에 올리지 마세요! (API 키 유출 위험)
- DB 없이도 개발 가능: API Route 파일에서 더미 데이터로 시작한 뒤 나중에 연결

---

## 다음 개발 단계

1. DB 연결 (Supabase 가입 후 `.env.local` 설정)
2. 카카오 지도 API 연결 (위치 기반 식당 검색)
3. 실시간 기능 강화 (Supabase Realtime 또는 Polling)
4. 카카오톡 공유 기능
