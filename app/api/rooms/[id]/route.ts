// ============================================================
// app/api/rooms/[id]/route.ts
// 방 단건 조회 (ID로) — 페이지들이 폴링할 때 쓰는 핵심 엔드포인트
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rooms/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const room = await db.room.findUnique({
      where: { id: params.id },
      include: {
        leader: true,
        confirmedRestaurant: {
          include: {
            menus: { where: { isAvailable: true }, orderBy: { menuCategory: 'asc' } },
          },
        },
        members: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!room) {
      return NextResponse.json(
        { success: false, error: '방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: room })
  } catch (error) {
    console.error('[GET /api/rooms/[id]]', error)
    return NextResponse.json(
      { success: false, error: '방 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/rooms/[id] — 방 상태 수동 변경 (리더 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { leaderId, status } = await request.json()

    const room = await db.room.findUnique({ where: { id: params.id } })
    if (!room) {
      return NextResponse.json({ success: false, error: '방을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (room.leaderId !== leaderId) {
      return NextResponse.json({ success: false, error: '리더만 수정할 수 있습니다.' }, { status: 403 })
    }

    const updated = await db.room.update({
      where: { id: params.id },
      data: { status },
      include: {
        leader: true,
        members: { include: { user: true } },
        confirmedRestaurant: { include: { menus: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PATCH /api/rooms/[id]]', error)
    return NextResponse.json(
      { success: false, error: '업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
