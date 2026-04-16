// ============================================================
// app/api/rooms/[id]/restaurant-vote/route.ts
// 식당 투표 (투표 모드 전용)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { RestaurantVoteBody } from '@/types/api'

// GET /api/rooms/[id]/restaurant-vote
// 현재 투표 현황 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    // 투표 현황 집계
    const votes = await db.restaurantVote.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true, imageUrl: true, category: true } },
      }
    })

    // 식당별 득표 수 집계
    const voteMap = new Map<string, {
      restaurant: typeof votes[0]['restaurant'],
      voteCount: number,
      voters: { id: string, name: string }[]
    }>()

    for (const vote of votes) {
      const existing = voteMap.get(vote.restaurantId)
      if (existing) {
        existing.voteCount++
        existing.voters.push(vote.user)
      } else {
        voteMap.set(vote.restaurantId, {
          restaurant: vote.restaurant,
          voteCount: 1,
          voters: [vote.user],
        })
      }
    }

    const summary = Array.from(voteMap.values())
      .sort((a, b) => b.voteCount - a.voteCount)

    return NextResponse.json({ success: true, data: { summary, totalVotes: votes.length } })
  } catch (error) {
    console.error('[GET /api/rooms/[id]/restaurant-vote]', error)
    return NextResponse.json(
      { success: false, error: '투표 현황을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/rooms/[id]/restaurant-vote
// 식당에 투표 (이미 투표했으면 다른 식당으로 변경)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const body: RestaurantVoteBody = await request.json()
    const { userId, restaurantId } = body

    if (!userId || !restaurantId) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 방이 식당 선정 중 상태인지 확인
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 방입니다.' },
        { status: 404 }
      )
    }
    if (room.status !== 'SELECTING_RESTAURANT') {
      return NextResponse.json(
        { success: false, error: '식당 선정 중인 방이 아닙니다.' },
        { status: 409 }
      )
    }
    if (room.selectionMode !== 'VOTE') {
      return NextResponse.json(
        { success: false, error: '투표 방식의 방이 아닙니다.' },
        { status: 409 }
      )
    }

    // 기존 투표 있으면 덮어쓰기 (다른 식당으로 변경)
    const vote = await db.restaurantVote.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId, restaurantId },
      update: { restaurantId },
      include: {
        restaurant: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ success: true, data: vote })
  } catch (error) {
    console.error('[POST /api/rooms/[id]/restaurant-vote]', error)
    return NextResponse.json(
      { success: false, error: '투표에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/rooms/[id]/restaurant-vote?userId=xxx
// 투표 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId가 필요합니다.' },
        { status: 400 }
      )
    }

    await db.restaurantVote.deleteMany({ where: { roomId, userId } })

    return NextResponse.json({ success: true, message: '투표가 취소되었습니다.' })
  } catch (error) {
    console.error('[DELETE /api/rooms/[id]/restaurant-vote]', error)
    return NextResponse.json(
      { success: false, error: '투표 취소에 실패했습니다.' },
      { status: 500 }
    )
  }
}
