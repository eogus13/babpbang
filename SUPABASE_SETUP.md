# 밥빵 — Supabase + 배포 세팅 가이드

> 이 가이드를 따라하면 밥빵 앱을 실제로 실행할 수 있습니다.

---

## 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 에 접속해 로그인
2. **New project** 클릭
3. Project name: `babpbang` (원하는 이름)
4. Database Password: 안전한 비밀번호 입력 후 저장 (나중에 필요)
5. Region: `Northeast Asia (Seoul)` 선택
6. **Create new project** 클릭 → 약 2분 대기

---

## 2. 데이터베이스 연결 정보 확인

프로젝트 생성 완료 후:

1. 왼쪽 메뉴 **Settings → Database** 클릭
2. **Connection string** 섹션에서 `URI` 탭 선택
3. `postgresql://postgres:[YOUR-PASSWORD]@...` 형태의 URL 복사

> ⚠️ Supabase는 연결 방식이 두 가지입니다:
> - **Transaction pooler** (포트 6543) → Prisma의 `DATABASE_URL`에 사용
> - **Direct connection** (포트 5432) → Prisma의 `DIRECT_URL`에 사용

---

## 3. .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일을 만들고 아래 내용을 채웁니다:

```env
# Supabase → Settings → Database → Connection string
# Transaction Pooler (포트 6543, ?pgbouncer=true 포함)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (포트 5432, migration용)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# 카카오 지도 API (선택 - 없으면 테스트 데이터로 동작)
NEXT_PUBLIC_KAKAO_MAP_KEY="your_kakao_rest_api_key"

# 앱 URL (배포 시 실제 주소로 변경)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> 💡 `.env.local`은 절대 git에 올리지 마세요. `.gitignore`에 이미 포함되어 있습니다.

---

## 4. 패키지 설치 및 DB 마이그레이션

터미널에서 프로젝트 폴더로 이동 후 순서대로 실행:

```bash
# 패키지 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# DB에 테이블 생성 (마이그레이션)
npx prisma migrate deploy
```

> 오류 없이 완료되면 Supabase Dashboard → **Table Editor**에서 테이블 7개가 생성된 걸 확인할 수 있습니다.

---

## 5. 테스트 데이터 넣기 (식당 샘플)

실제 Kakao Places API 연동 전에 앱을 테스트하려면 샘플 식당 데이터가 필요합니다.

Supabase Dashboard → **SQL Editor** 에서 아래 SQL 실행:

```sql
-- 샘플 식당 3개 추가 (서울 중구 기준)
INSERT INTO "Restaurant" (id, name, category, address, lat, lng, rating, "reviewCount", phone, "businessHours", "imageUrl")
VALUES
  (gen_random_uuid(), '황금참치', '일식', '서울 중구 을지로 100', 37.5665, 126.9780, 4.5, 128, '02-1234-5678', '11:00~22:00', NULL),
  (gen_random_uuid(), '명동칼국수', '한식', '서울 중구 명동길 25', 37.5640, 126.9822, 4.2, 256, '02-9876-5432', '10:30~21:30', NULL),
  (gen_random_uuid(), '이태리키친', '양식', '서울 중구 퇴계로 50', 37.5620, 126.9753, 4.0, 89, '02-5555-7777', '11:30~22:00', NULL);

-- 각 식당에 메뉴 추가
INSERT INTO "Menu" (id, "restaurantId", name, price, "menuCategory", "isAvailable")
SELECT gen_random_uuid(), id, '참치회 정식', 18000, '정식', true FROM "Restaurant" WHERE name = '황금참치'
UNION ALL
SELECT gen_random_uuid(), id, '연어 덮밥', 13000, '덮밥', true FROM "Restaurant" WHERE name = '황금참치'
UNION ALL
SELECT gen_random_uuid(), id, '바지락 칼국수', 9000, '면류', true FROM "Restaurant" WHERE name = '명동칼국수'
UNION ALL
SELECT gen_random_uuid(), id, '해물 칼국수', 11000, '면류', true FROM "Restaurant" WHERE name = '명동칼국수'
UNION ALL
SELECT gen_random_uuid(), id, '봉골레 파스타', 14000, '파스타', true FROM "Restaurant" WHERE name = '이태리키친'
UNION ALL
SELECT gen_random_uuid(), id, '까르보나라', 15000, '파스타', true FROM "Restaurant" WHERE name = '이태리키친';
```

---

## 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 → 밥빵 앱 확인!

---

## 7. Vercel 배포 (선택)

### 7-1. Vercel 프로젝트 연결

1. [https://vercel.com](https://vercel.com) 접속 → **New Project**
2. GitHub 저장소 연결 (코드를 GitHub에 push한 경우)
3. Framework: **Next.js** 자동 감지됨

### 7-2. 환경변수 설정

Vercel 프로젝트 → **Settings → Environment Variables** 에서 `.env.local`의 내용을 그대로 입력:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Supabase Transaction Pooler URL |
| `DIRECT_URL` | Supabase Direct URL |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

### 7-3. 배포

```bash
# Vercel CLI로 배포
npx vercel --prod
```

또는 GitHub push 시 자동 배포됩니다.

---

## 8. 카카오 지도 API 연동 (선택)

실제 위치 기반 식당 추천을 위해:

1. [https://developers.kakao.com](https://developers.kakao.com) 접속 → 앱 생성
2. **앱 키** 탭에서 **REST API 키** 복사
3. `.env.local`의 `NEXT_PUBLIC_KAKAO_MAP_KEY`에 입력
4. `app/room/new/page.tsx`의 `navigator.geolocation.getCurrentPosition`이 실제 위도/경도를 Prisma에 저장
5. `app/room/[id]/restaurants/page.tsx`에서 `room.lat / room.lng`를 바로 사용합니다 ✅

---

## 자주 발생하는 오류

| 오류 | 해결 방법 |
|------|-----------|
| `P1001: Can't reach database server` | DATABASE_URL의 비밀번호 확인, `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체 |
| `P3005: The database schema is not empty` | `npx prisma migrate deploy` 대신 `npx prisma db push` 사용 |
| `Cannot find module '@prisma/client'` | `npx prisma generate` 실행 |
| `Error: 초대 코드가 필요합니다.` | URL에 `?code=` 파라미터가 없는 경우, 정상 동작임 |

---

## 파일 구조 요약

```
babpbang/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx            # 홈 (밥약속 목록)
│   ├── onboarding/         # 팀·이름 설정
│   ├── room/
│   │   ├── new/            # 밥약속 만들기
│   │   └── [id]/
│   │       ├── invite/     # 팀원 초대 + 참여 현황
│   │       ├── vote/       # 참여 여부 투표
│   │       ├── restaurants/# 식당 목록
│   │       ├── menu/       # 메뉴 선택
│   │       └── summary/    # 최종 요약
│   ├── restaurant/[id]/    # 식당 상세 + 투표
│   ├── join/[code]/        # 초대 링크 랜딩
│   └── api/                # API Route handlers
├── components/             # 재사용 UI 컴포넌트
├── contexts/               # UserContext
├── lib/                    # api.ts, db.ts, utils.ts
├── prisma/schema.prisma    # DB 스키마
└── types/api.ts            # TypeScript 타입
```
