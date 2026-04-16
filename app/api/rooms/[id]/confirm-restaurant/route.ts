// ============================================================
// app/api/rooms/[id]/confirm-restaurant/route.ts
// 식당 확정
// - 투표 모드: 리더가 "투표 마감" 버튼 → 최다 득표 자동 확정 (동점 시 리더가 직접 선택)
// - 리더 선택 모드: 리더가 식당 상세에서 "여기서 먹어요!" 클릭 → 즉시 확정
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ConfirmRestaurantBody } from '@/types/api'

// POST /api/rooms/[id]/confirm-restaurant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const body: ConfirmRestaurantBody = await request.json()
    const { leaderId, restaurantId } = body

    if (!leaderId || !restaurantId) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 방 정보 조회 및 권한 확인
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 방입니다.' },
        { status: 404 }
      )
    }
    if (room.leaderId !== leaderId) {
      return NextResponse.json(
        { success: false, error: '리더만 식당을 확정할 수 있습니다.' },
        { status: 403 }
      )
    }
    if (room.status !== 'SELECTING_RESTAURANT') {
      return NextResponse.json(
        { success: false, error: '식당 선정 중인 방이 아닙니다.' },
        { status: 409 }
      )
    }

    // 식당 존재 여부 확인
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: { menus: { where: { isAvailable: true } } }
    })
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 식당입니다.' },
        { status: 404 }
      )
    }

    // 식당 확정 + 상태 변경
    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: {
        confirmedRestaurantId: restaurantId,
        status: 'RESTAURANT_CONFIRMED',
      },
      include: {
        leader: true,
        confirmedRestaurant: { include: { menus: { where: { isAvailable: true } } } },
        members: { include: { user: true } },
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRoom,
      message: `${restaurant.name}이 확정되었습니다! 메뉴를 선택해주세요.`,
    })
  } catch (error) {
    console.error('[POST /api/rooms/[id]/confirm-restaurant]', error)
    return NextResponse.json(
      { success: false, error: '식당 확정에 실패했습니다.' },
      { status: 500 }
    )
  }
}
