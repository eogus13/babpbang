// ============================================================
// app/api/users/route.ts
// 사용자 등록 / 조회
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RegisterUserBody } from '@/types/api'

// POST /api/users
// 온보딩: 이름 + 팀 입력 후 사용자 등록 (없으면 생성, 있으면 업데이트)
export async function POST(request: NextRequest) {
  try {
    const body: RegisterUserBody = await request.json()
    const { deviceId, name, team } = body

    if (!deviceId || !name || !team) {
      return NextResponse.json(
        { success: false, error: '이름과 소속 팀을 입력해주세요.' },
        { status: 400 }
      )
    }

    const user = await db.user.upsert({
      where: { deviceId },
      create: { deviceId, name, team },
      update: { name, team },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[POST /api/users]', error)
    return NextResponse.json(
      { success: false, error: '사용자 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/users?deviceId=xxx
// 현재 사용자 정보 조회
export async function GET(request: NextRequest) {
  try {
    const deviceId = request.nextUrl.searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'deviceId가 필요합니다.' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { deviceId } })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[GET /api/users]', error)
    return NextResponse.json(
      { success: false, error: '사용자 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
