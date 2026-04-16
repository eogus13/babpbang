// ============================================================
// app/api/restaurants/[id]/route.ts
// 식당 상세 조회 (ID로)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/restaurants/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = await db.restaurant.findUnique({
      where: { id: params.id },
      include: {
        menus: {
          where: { isAvailable: true },
          orderBy: [{ menuCategory: 'asc' }, { price: 'asc' }],
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: '식당을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: restaurant })
  } catch (error) {
    console.error('[GET /api/restaurants/[id]]', error)
    return NextResponse.json(
      { success: false, error: '식당 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
