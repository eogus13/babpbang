// ============================================================
// app/api/rooms/[id]/summary/route.ts
// 최종 요약 조회 (누가 어떤 메뉴를 선택했는지)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rooms/[id]/summary
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        leader: true,
        confirmedRestaurant: {
          include: { menus: { where: { isAvailable: true } } }
        },
        members: {
          where: { attendance: 'JOIN' },
          include: { user: true }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 방입니다.' },
        { status: 404 }
      )
    }

    // 참여자별 선택 메뉴
    const allSelections = await db.menuSelection.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true, team: true } },
        menu: true,
      }
    })

    const memberMenus = (room.members as any[]).map((member: any) => {
      const userSelections = (allSelections as any[]).filter((s: any) => s.userId === member.userId)
      const menus = userSelections.map((s: any) => s.menu)
      const totalPrice = menus.reduce((sum: number, m: any) => sum + (m?.price ?? 0), 0)
      return { user: member.user, menus, totalPrice }
    })

    const totalEstimatedPrice = memberMenus.reduce((sum: number, m: any) => sum + m.totalPrice, 0)

    return NextResponse.json({
      success: true,
      data: {
        room,
        restaurant: room.confirmedRestaurant,
        memberMenus,
        totalParticipants: room.members.length,
        totalEstimatedPrice,
      }
    })
  } catch (error) {
    console.error('[GET /api/rooms/[id]/summary]', error)
    return NextResponse.json(
      { success: false, error: '요약 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
