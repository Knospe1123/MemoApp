# MemoApp

React(Vite) 메모 앱 + Prisma(PostgreSQL) + 회원가입/로그인/로그아웃. 로컬에서는 Express API, [Vercel](https://vercel.com) 배포 시에는 `api/` 서버리스 함수로 동일 API가 제공됩니다.

## 로컬 개발

1. PostgreSQL 준비 (택 1)
   - **Docker:** `docker compose up -d`
   - 또는 Neon / Supabase 등에서 연결 문자열 발급
2. `.env` 작성 (`.env.example` 참고)
   - Docker 기본값: `postgresql://memo:memo@127.0.0.1:5432/memo?schema=public`
3. DB 스키마 적용: `npx prisma migrate deploy`
4. 실행: `npm run dev` (API `:4000`, Vite `:5173`)

## Vercel 배포

1. GitHub에 푸시 후 Vercel에서 프로젝트 연결
2. **Environment Variables** (Production / Preview)
   - `DATABASE_URL` — Vercel Postgres, Neon 등 **PostgreSQL** 연결 문자열
   - `JWT_SECRET` — 32자 이상 무작위 문자열
   - `CLIENT_ORIGIN` — 프로덕션 URL (예: `https://your-app.vercel.app`). Preview에서도 쓰려면 배포 URL과 맞추거나, 서버는 `*.vercel.app`을 CORS로 허용합니다.
3. 빌드는 `npm run vercel-build`(`vercel.json`의 `buildCommand`)로 마이그레이션을 적용합니다. 이전에 실패한 기록(P3009)이 있으면 `migrate resolve --rolled-back` 후 한 번 더 `deploy`를 시도합니다. 그래도 실패하면 Neon SQL에서 `"Memo"`, `"User"` 테이블을 삭제한 뒤 재배포하세요.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | API + Vite 동시 실행 |
| `npm run build` | `prisma generate` + Vite 빌드 (로컬용, DB 마이그레이션 없음) |
| `npm run db:migrate` | 로컬에서 마이그레이션 생성/적용 (`migrate dev`) |
