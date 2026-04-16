// ============================================================
// lib/db.ts — JSON 파일 기반 mock DB (로컬 개발용, Prisma API 호환)
// ============================================================

import fs from 'fs'
import path from 'path'

const DB_DIR = path.join(process.cwd(), 'prisma', 'jsondb')

// ── 유틸 ────────────────────────────────────────────────────
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function readTable<T = Record<string, any>>(name: string): T[] {
  const file = path.join(DB_DIR, `${name}.json`)
  if (!fs.existsSync(file)) return []
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) } catch { return [] }
}

function writeTable(name: string, data: unknown[]) {
  fs.mkdirSync(DB_DIR, { recursive: true })
  fs.writeFileSync(path.join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2))
}

// 단순 where 매칭 (id, string, boolean, 복합키 포함)
function matchWhere(item: Record<string, any>, where: Record<string, any>): boolean {
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined) continue
    if (k === 'OR')  { if (!(v as any[]).some((w: any) => matchWhere(item, w))) return false; continue }
    if (k === 'NOT') { if (matchWhere(item, v)) return false; continue }
    if (k === 'members') continue // 관계 where는 별도 처리
    // Prisma 복합 유니크 키 표기: { roomId_userId: { roomId, userId } }
    if (k.includes('_') && typeof v === 'object' && v !== null && !('notIn' in v) && !('in' in v)) {
      if (!matchWhere(item, v)) return false
      continue
    }
    if (typeof v === 'object' && v !== null) {
      if ('notIn' in v) { if ((v.notIn as string[]).includes(item[k])) return false; continue }
      if ('in'    in v) { if (!(v.in as string[]).includes(item[k])) return false; continue }
      if ('some'  in v) continue // 하위 관계 조건 — 현재 무시
    }
    if (item[k] !== v) return false
  }
  return true
}

// include 옵션 처리 — 관계 데이터를 JavaScript에서 조인
function resolveIncludes(item: Record<string, any>, include: Record<string, any> | undefined): Record<string, any> {
  if (!include) return item
  const result = { ...item }

  for (const [key, val] of Object.entries(include)) {
    if (!val) continue
    const opts = typeof val === 'object' ? val : {}

    switch (key) {
      // Room.leader
      case 'leader': {
        const users = readTable<any>('users')
        result.leader = users.find(u => u.id === item.leaderId) ?? null
        break
      }
      // Room.members
      case 'members': {
        const members = readTable<any>('roomMembers').filter(m => m.roomId === item.id)
        if (opts.include?.user) {
          const users = readTable<any>('users')
          result.members = members.map(m => ({ ...m, user: users.find(u => u.id === m.userId) ?? null }))
        } else {
          result.members = members
        }
        if (opts.orderBy) {
          const [field, dir] = Object.entries(opts.orderBy)[0] as [string, string]
          result.members.sort((a: any, b: any) =>
            dir === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)
          )
        }
        break
      }
      // Room.confirmedRestaurant
      case 'confirmedRestaurant': {
        if (!item.confirmedRestaurantId) { result.confirmedRestaurant = null; break }
        const rests = readTable<any>('restaurants')
        const rest = rests.find(r => r.id === item.confirmedRestaurantId) ?? null
        if (rest && opts.include?.menus) {
          const menus = readTable<any>('menus').filter(m => m.restaurantId === rest.id)
          result.confirmedRestaurant = { ...rest, menus }
        } else {
          result.confirmedRestaurant = rest
        }
        break
      }
      // RestaurantVote.restaurant / RestaurantVote.user
      case 'restaurant': {
        const rests = readTable<any>('restaurants')
        result.restaurant = rests.find(r => r.id === item.restaurantId) ?? null
        break
      }
      case 'user': {
        const users = readTable<any>('users')
        result.user = users.find(u => u.id === item.userId) ?? null
        break
      }
      // Restaurant.menus (include: { menus: true } or include: { menus: { where, orderBy } })
      case 'menus': {
        let menus = readTable<any>('menus').filter(m => m.restaurantId === item.id)
        if (opts.where) menus = menus.filter((m: any) => matchWhere(m, opts.where))
        if (opts.orderBy) {
          const entries = Object.entries(opts.orderBy) as [string, string][]
          menus.sort((a: any, b: any) => {
            for (const [field, dir] of entries) {
              if (a[field] !== b[field]) return dir === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)
            }
            return 0
          })
        }
        result.menus = menus
        break
      }
      // MenuSelection.menu
      case 'menu': {
        const menus = readTable<any>('menus')
        result.menu = menus.find(m => m.id === item.menuId) ?? null
        break
      }
    }
  }
  return result
}

// ── 제네릭 모델 팩토리 ──────────────────────────────────────
function makeModel(tableName: string) {
  return {
    async findUnique({ where, include }: { where: any; include?: any }) {
      const rows = readTable<any>(tableName)
      const row = rows.find(r => matchWhere(r, where)) ?? null
      return row ? resolveIncludes(row, include) : null
    },

    async findFirst({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any } = {}) {
      const rows = readTable<any>(tableName)
      let filtered = where ? rows.filter(r => matchWhere(r, where)) : rows
      if (orderBy) {
        const entries = Object.entries(orderBy) as [string, string][]
        filtered.sort((a, b) => {
          for (const [field, dir] of entries) {
            if (a[field] !== b[field]) return dir === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)
          }
          return 0
        })
      }
      const row = filtered[0] ?? null
      return row ? resolveIncludes(row, include) : null
    },

    async findMany({ where, include, orderBy, select, distinct }: { where?: any; include?: any; orderBy?: any; select?: any; distinct?: any } = {}) {
      let rows = readTable<any>(tableName)

      // members.some 처리
      if (where?.members?.some) {
        const cond = where.members.some
        const members = readTable<any>('roomMembers')
        const roomIds = new Set(members.filter((m: any) => matchWhere(m, cond)).map((m: any) => m.roomId))
        rows = rows.filter((r: any) => roomIds.has(r.id))
        const restWhere = { ...where }
        delete restWhere.members
        rows = rows.filter((r: any) => matchWhere(r, restWhere))
      } else if (where) {
        rows = rows.filter(r => matchWhere(r, where))
      }

      if (orderBy) {
        const entries = Object.entries(orderBy) as [string, string][]
        rows.sort((a, b) => {
          for (const [field, dir] of entries) {
            if (a[field] !== b[field]) return dir === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)
          }
          return 0
        })
      }

      return rows.map(r => resolveIncludes(r, include))
    },

    async create({ data, include }: { data: any; include?: any }) {
      const rows = readTable<any>(tableName)
      const now = new Date().toISOString()
      const newRow: Record<string, any> = {
        id: genId(),
        createdAt: now,
        updatedAt: now,
        ...data,
      }

      // nested create 지원 (Room.members)
      if (data.members?.create) {
        delete newRow.members
        rows.push(newRow)
        writeTable(tableName, rows)

        const createList = Array.isArray(data.members.create) ? data.members.create : [data.members.create]
        const memberRows = readTable<any>('roomMembers')
        for (const m of createList) {
          memberRows.push({ id: genId(), roomId: newRow.id, createdAt: now, updatedAt: now, ...m })
        }
        writeTable('roomMembers', memberRows)
      } else {
        rows.push(newRow)
        writeTable(tableName, rows)
      }

      return resolveIncludes(newRow, include)
    },

    async update({ where, data, include }: { where: any; data: any; include?: any }) {
      const rows = readTable<any>(tableName)
      const idx = rows.findIndex(r => matchWhere(r, where))
      if (idx === -1) throw new Error(`[db.${tableName}.update] record not found: ${JSON.stringify(where)}`)
      rows[idx] = { ...rows[idx], ...data, updatedAt: new Date().toISOString() }
      writeTable(tableName, rows)
      return resolveIncludes(rows[idx], include)
    },

    async upsert({ where, update, create, include }: { where: any; update: any; create: any; include?: any }) {
      const rows = readTable<any>(tableName)
      const idx = rows.findIndex(r => matchWhere(r, where))
      if (idx !== -1) {
        rows[idx] = { ...rows[idx], ...update, updatedAt: new Date().toISOString() }
        writeTable(tableName, rows)
        return resolveIncludes(rows[idx], include)
      } else {
        const now = new Date().toISOString()
        const newRow = { id: genId(), createdAt: now, updatedAt: now, ...create }
        rows.push(newRow)
        writeTable(tableName, rows)
        return resolveIncludes(newRow, include)
      }
    },

    async delete({ where }: { where: any }) {
      const rows = readTable<any>(tableName)
      const idx = rows.findIndex(r => matchWhere(r, where))
      if (idx === -1) return null
      const [deleted] = rows.splice(idx, 1)
      writeTable(tableName, rows)
      return deleted
    },

    async deleteMany({ where }: { where?: any } = {}) {
      const rows = readTable<any>(tableName)
      const kept = where ? rows.filter(r => !matchWhere(r, where)) : []
      const deleted = rows.length - kept.length
      writeTable(tableName, kept)
      return { count: deleted }
    },

    async createMany({ data }: { data: any[] }) {
      const rows = readTable<any>(tableName)
      const now = new Date().toISOString()
      const newRows = data.map(d => ({ id: genId(), createdAt: now, updatedAt: now, ...d }))
      writeTable(tableName, [...rows, ...newRows])
      return { count: newRows.length }
    },

    async count({ where }: { where?: any } = {}) {
      const rows = readTable<any>(tableName)
      return where ? rows.filter(r => matchWhere(r, where)).length : rows.length
    },
  }
}

// ── 내보낼 db 객체 (Prisma 클라이언트 호환) ─────────────────
export const db = {
  user:           makeModel('users'),
  room:           makeModel('rooms'),
  roomMember:     makeModel('roomMembers'),
  restaurant:     makeModel('restaurants'),
  menu:           makeModel('menus'),
  restaurantVote: makeModel('restaurantVotes'),
  menuSelection:  makeModel('menuSelections'),
  $disconnect: async () => {},
}

export default db
