// ============================================================
// app/api/rooms/route.ts
// 밥약속 방 생성 / 목록 조회
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CreateRoomBody } from '@/types/api'

// 초대 코드 생성 (예: A3F-92X)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part1}-${part2}`
}

// POST /api/rooms
// 새 밥약속 방 생성
export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomBody = await request.json()
    const { leaderId, mealTime, selectionMode, maxWalkMinutes = 10, lat, lng } = body

    if (!leaderId || !mealTime || !selectionMode) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 고유한 초대 코드 생성 (충돌 시 재시도)
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await db.room.findUnique({ where: { code } })
      if (!existing) break
      code = generateRoomCode()
      attempts++
    }

    const room = await db.room.create({
      data: {
        code,
        leaderId,
        mealTime: new Date(mealTime),
        selectionMode,
        status: 'WAITING_ATTENDANCE',
        maxWalkMinutes,
        lat,
        lng,
        confirmedRestaurantId: null,
        // 방장은 자동으로 JOIN으로 참여
        members: {
          create: {
            userId: leaderId,
            attendance: 'JOIN',
            joinedAt: new Date(),
          }
        }
      },
      include: {
        leader: true,
        members: { include: { user: true } },
      }
    })

    return NextResponse.json({ success: true, data: room }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/rooms]', error)
    return NextResponse.json(
      { success: false, error: '밥약속 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/rooms?code=A3F-92X  — 초대 코드로 방 조회
// GET /api/rooms?userId=xxx    — 유저가 참여 중인 방 목록 조회 (홈 화면)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const code   = searchParams.get('code')
    const userId = searchParams.get('userId')

    // ─── 초대 코드로 단건 조회 ─────────────────────────
    if (code) {
      const room = await db.room.findUnique({
        where: { code },
        include: {
          leader: true,
          members: { include: { user: true } },
          confirmedRestaurant: { include: { menus: true } },
        },
      })

      if (!room) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 초대 코드입니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: room })
    }

    // ─── 유저 ID로 참여 방 목록 조회 ──────────────────
    if (userId) {
      const rooms = await db.room.findMany({
        where: {
          members: { some: { userId } },
          status: { notIn: ['CANCELLED'] },
        },
        include: {
          leader: true,
          members: { include: { user: true } },
          confirmedRestaurant: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ success: true, data: rooms })
    }

    return NextResponse.json(
      { success: false, error: 'code 또는 userId 파라미터가 필요합니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[GET /api/rooms]', error)
    return NextResponse.json(
      { success: false, error: '방 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
