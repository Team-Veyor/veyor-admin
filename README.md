# Veyor 어드민 (veyor-admin)

Veyor(백설기) 설문 서비스의 **운영자 어드민**. veyor-app 과 **동일한 Supabase 프로젝트**를 사용한다.

세 가지 기능을 한 앱에 담는다.

| 기능 | 경로 | 접근 |
| --- | --- | --- |
| ① 설문 **수기 등록** (운영자가 DB에 직접 등록) | `/surveys/new` | 운영자 로그인 |
| ② 설문 **관리 테이블** (엑셀 느낌, 승인/게시/정산 인라인 편집 + CSV 내보내기) | `/` | 운영자 로그인 |
| ③ 고객용 **공개 접수 폼** (모집자에게 공유) | `/submit` | 비로그인 공개 |

접수(intake)된 설문은 `approval_status='pending'`, `is_published=false` 로 저장되고,
운영자가 관리 테이블에서 **승인 + 게시**해야 비로소 앱(veyor-app `/surveys/today`)에 노출된다.

---

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- `@supabase/supabase-js` + `@supabase/ssr` (쿠키 기반 운영자 세션)
- Biome (lint/format) — veyor-app 과 동일 규칙
- 스타일: 의존성 최소화를 위해 plain CSS (`src/app/globals.css`)

## 데이터 접근 모델

- **서버 전용 secret key**(`SUPABASE_SECRET_KEY`)로 RLS 를 우회해 관리/접수 쓰기를 수행 → `src/lib/supabase/admin.ts` (`server-only`).
- 운영자 로그인(Supabase Auth)은 publishable key 로 브라우저/SSR 에서 수행 → `client.ts` / `server.ts`.
- 공개 접수 폼도 **서버 액션(secret key)** 경유로만 insert → anon 쓰기 정책 불필요, 임의 컬럼 주입 차단.
- 접근 제어: `src/proxy.ts`(Next 16 proxy, 구 middleware) + `ADMIN_ALLOWLIST` 이메일 허용목록. `/login`·`/submit` 만 공개.

## 엑셀 ↔ DB 필드

모든 설문 항목은 `src/lib/survey-fields.ts` 한 곳에 정의(엑셀 라벨 ↔ DB 컬럼 ↔ 타입 ↔ 입력 주체).
접수 폼·관리 테이블·수기 등록 폼이 전부 이 정의를 재사용하므로, 컬럼 추가는 이 파일만 고치면 된다.

---

## 셋업

### 1) 의존성 설치

```bash
cd veyor-admin
pnpm install   # 또는 npm install
```

### 2) 환경변수 (`.env`)

`veyor-app` 과 같은 Supabase 프로젝트 값. 대시보드 > Project Settings > API Keys.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # veyor-app 과 동일 값
SUPABASE_SECRET_KEY=sb_secret_...                  # 서버 전용 (커밋 금지)
ADMIN_ALLOWLIST=ops@example.com,other@example.com  # 운영자 이메일(콤마 구분)
```

> ⚠️ 현재 `.env` 에는 `SUPABASE_SECRET_KEY` 만 채워져 있고
> `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 는 자리표시자다. 실제 값으로 교체해야 동작한다.

### 3) DB 마이그레이션

설문 접수/승인/정산 컬럼은 **veyor-app 이 정본**이다. veyor-app 에서 적용한다.

```bash
# veyor-app 저장소에서
supabase db push   # apps/server/supabase/migrations/20260618100257_admin_survey_intake.sql 적용
```

### 4) 운영자 계정

Supabase 대시보드 > Authentication > Users 에서 운영자 계정을 만들고(이메일+비밀번호),
그 이메일을 `ADMIN_ALLOWLIST` 에 추가한다.

### 5) 실행

```bash
pnpm dev     # http://localhost:3100
```

- 운영자: `http://localhost:3100/login` → 로그인 → 관리 테이블/수기 등록
- 모집자 공유용 접수 폼: `http://localhost:3100/submit`

## 검증

```bash
pnpm typecheck
pnpm check     # biome (lint+format)
pnpm build
```

---

## 배포 (Vercel)

Next.js 자동 감지로 **무설정** 배포된다.

1. Vercel > **Add New > Project** > `Team-Veyor/veyor-admin` import (Framework: Next.js 자동, Root `./`).
2. **Environment Variables** 등록 (Production + Preview):

   | 키 | 값 |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (`sb_publishable_...`) |
   | `SUPABASE_SECRET_KEY` | secret key (`sb_secret_...`) — **Sensitive** 체크 |
   | `ADMIN_ALLOWLIST` | 운영자 이메일(콤마 구분) |

3. **선행 조건**: veyor-app 에서 `supabase db push` 로 마이그레이션(승인/접수 컬럼) 적용. 누락 시 런타임 에러.
4. Deploy. 이후 `main` 푸시/머지 시 자동 재배포.

- 공개 접수 폼(모집자 공유용): `https://<배포도메인>/submit`
- 운영자 로그인: `https://<배포도메인>/login`

