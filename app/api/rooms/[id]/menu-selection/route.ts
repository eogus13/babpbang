// ============================================================
// app/api/rooms/[id]/menu-selection/route.ts
// 메뉴 선택 / 조회 / 취소
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { MenuSelectionBody } from '@/types/api'

// GET /api/rooms/[id]/menu-selection
// 이 방의 모든 팀원 메뉴 선택 현황 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    const selections = await db.menuSelection.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true, team: true } },
        menu: true,
      }
    })

    // 사람별로 묶기
    const byUser = new Map<string, {
      user: typeof selections[0]['user'],
      menus: typeof selections[0]['menu'][],
      totalPrice: number,
    }>()

    for (const sel of selections) {
      const existing = byUser.get(sel.userId)
      if (existing) {
        existing.menus.push(sel.menu)
        existing.totalPrice += sel.menu.price
      } else {
        byUser.set(sel.userId, {
          user: sel.user,
          menus: [sel.menu],
          totalPrice: sel.menu.price,
        })
      }
    }

    const memberMenus = Array.from(byUser.values())
    const totalEstimatedPrice = memberMenus.reduce((sum, m) => sum + m.totalPrice, 0)

    return NextResponse.json({
      success: true,
      data: { memberMenus, totalEstimatedPrice }
    })
  } catch (error) {
    console.error('[GET /api/rooms/[id]/menu-selection]', error)
    return NextResponse.json(
      { success: false, error: '메뉴 선택 현황을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/rooms/[id]/menu-selection
// 메뉴 선택 (여러 개 한 번에 가능)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const body: MenuSelectionBody = await request.json()
    const { userId, menuIds } = body

    if (!userId || !menuIds?.length) {
      return NextResponse.json(
        { success: false, error: '메뉴를 하나 이상 선택해주세요.' },
        { status: 400 }
      )
    }

    // 방이 식당 확정 상태인지 확인
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room || room.status !== 'RESTAURANT_CONFIRMED') {
      return NextResponse.json(
        { success: false, error: '메뉴를 선택할 수 있는 상태가 아닙니다.' },
        { status: 409 }
      )
    }

    // 기존 선택 모두 삭제 후 새로 저장 (메뉴 변경 시)
    await db.menuSelection.deleteMany({ where: { roomId, userId } })

    const selections = await db.menuSelection.createMany({
      data: menuIds.map(menuId => ({ roomId, userId, menuId })),
    })

    // 전원이 메뉴 선택 완료했는지 확인
    const joinedMembers = await db.roomMember.findMany({
      where: { roomId, attendance: 'JOIN' }
    })
    const usersWithSelection = await db.menuSelection.findMany({
      where: { roomId },
      select: { userId: true },
      distinct: ['userId'],
    })

    const allSelected = joinedMembers.every(m =>
      usersWithSelection.some(s => s.userId === m.userId)
    )

    // 전원 선택 완료 시 방 상태 → COMPLETED
    if (allSelected) {
      await db.room.update({
        where: { id: roomId },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json({
      success: true,
      data: { count: selections.count, allCompleted: allSelected },
      message: allSelected ? '모두 메뉴 선택 완료! 맛있게 드세요 🍚' : '메뉴가 선택되었습니다.',
    })
  } catch (error) {
    console.error('[POST /api/rooms/[id]/menu-selection]', error)
    return NextResponse.json(
      { success: false, error: '메뉴 선택에 실패했습니다.' },
      { status: 500 }
    )
  }
}
