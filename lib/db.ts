// ============================================================
// lib/db.ts — 스마트 DB 라우터
// - 로컬 개발 (DATABASE_URL 없음): JSON 파일 mock DB 사용
// - 프로덕션 (DATABASE_URL = postgres://...): Prisma + Supabase 사용
// ============================================================

const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawDb = isPostgres
  ? (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require('@prisma/client')
      const g = globalThis as { _prisma?: typeof PrismaClient }
      if (!g._prisma) g._prisma = new PrismaClient({ log: ['error'] })
      return g._prisma
    })()
  : require('./db.mock').db

export const db = rawDb as ReturnType<typeof import('./db.mock').db extends infer T ? () => T : never> & {
  user: any; room: any; roomMember: any
  restaurant: any; menu: any
  restaurantVote: any; menuSelection: any
  $disconnect: () => Promise<void>
}

export default db
