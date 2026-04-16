// ============================================================
// app/api/rooms/[id]/attendance/route.ts
// 참여 여부 투표 (먹을게요 / 패스)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { AttendanceBody } from '@/types/api'

// PATCH /api/rooms/[id]/attendance
// 참여 여부 응답 또는 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const body: AttendanceBody = await request.json()
    const { userId, attendance } = body

    if (!userId || !attendance) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 방 존재 여부 확인
    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 방입니다.' },
        { status: 404 }
      )
    }

    // 이미 식당 선정이 시작된 방이면 참여 변경 불가
    if (room.status !== 'WAITING_ATTENDANCE') {
      return NextResponse.json(
        { success: false, error: '이미 식당 선정이 시작된 방입니다.' },
        { status: 409 }
      )
    }

    // 참여자 없으면 생성, 있으면 업데이트
    const member = await db.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: {
        roomId,
        userId,
        attendance,
        joinedAt: attendance === 'JOIN' ? new Date() : null,
      },
      update: {
        attendance,
        joinedAt: attendance === 'JOIN' ? new Date() : null,
      },
      include: { user: true }
    })

    // 전원이 응답했고 1명 이상 참여 시 → 식당 선정 단계로 자동 전환
    const allMembers = await db.roomMember.findMany({ where: { roomId } })
    const allResponded = allMembers.every(m => m.attendance !== 'PENDING')
    const hasParticipants = allMembers.some(m => m.attendance === 'JOIN')

    if (allResponded && hasParticipants) {
      await db.room.update({
        where: { id: roomId },
        data: { status: 'SELECTING_RESTAURANT' }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        member,
        roomStatus: allResponded && hasParticipants ? 'SELECTING_RESTAURANT' : room.status,
      }
    })
  } catch (error) {
    console.error('[PATCH /api/rooms/[id]/attendance]', error)
    return NextResponse.json(
      { success: false, error: '참여 여부 응답에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/rooms/[id]/attendance
// 초대 링크로 방 입장 (처음 들어오는 경우)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId가 필요합니다.' },
        { status: 400 }
      )
    }

    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 방입니다.' },
        { status: 404 }
      )
    }

    // 이미 멤버면 기존 정보 반환
    const existing = await db.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { user: true }
    })

    if (existing) {
      return NextResponse.json({ success: true, data: existing })
    }

    // 신규 멤버 추가 (PENDING 상태로)
    const member = await db.roomMember.create({
      data: { roomId, userId, attendance: 'PENDING' },
      include: { user: true }
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/rooms/[id]/attendance]', error)
    return NextResponse.json(
      { success: false, error: '방 입장에 실패했습니다.' },
      { status: 500 }
    )
  }
}
