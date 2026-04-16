'use client'

// ============================================================
// app/join/[code]/page.tsx
// 초대 링크 랜딩 페이지
// babpbang.com/join/A3F-92X 로 접속했을 때 보이는 화면
// 온보딩 안 됐으면 → 온보딩 → 다시 이 페이지로 복귀
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getRoomByCode, joinRoom } from '@/lib/api'
import type { Room } from '@/types/api'

function formatMealTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  // 방 정보 불러오기
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRoomByCode(params.code)
        setRoom(data)
      } catch {
        setError('존재하지 않는 초대 코드예요.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.code])

  // 온보딩 안 됐으면 → 온보딩으로 (복귀 경로 저장)
  useEffect(() => {
    if (!userLoading && !user) {
      sessionStorage.setItem('babpbang_redirect', `/join/${params.code}`)
      router.replace('/onboarding')
    }
  }, [user, userLoading, params.code, router])

  const handleJoin = async () => {
    if (!user || !room) return
    setIsJoining(true)
    try {
      await joinRoom(room.id, user.id)
      // 참여 여부 투표 화면으로 이동
      router.replace(`/room/${room.id}/vote`)
    } catch {
      setError('입장에 실패했습니다. 다시 시도해주세요.')
      setIsJoining(false)
    }
  }

  // 이미 멤버인지 확인
  const isAlreadyMember = room?.members?.some(m => m.userId === user?.id)

  const handleAlreadyMember = () => {
    if (!room) return
    const member = room.members?.find(m => m.userId === user?.id)
    // 현재 단계에 맞는 화면으로 이동
    if (room.status === 'WAITING_ATTENDANCE' && member?.attendance === 'PENDING') {
      router.push(`/room/${room.id}/vote`)
    } else if (room.status === 'SELECTING_RESTAURANT') {
      router.push(`/room/${room.id}/restaurants`)
    } else if (room.status === 'RESTAURANT_CONFIRMED') {
      router.push(`/room/${room.id}/menu`)
    } else if (room.status === 'COMPLETED') {
      router.push(`/room/${room.id}/summary`)
    } else {
      router.push(`/room/${room.id}/invite`)
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">초대 정보 확인 중...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <span className="text-5xl">😢</span>
          <p className="font-semibold text-gray-700">{error || '링크를 찾을 수 없어요'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    )
  }

  const joinCount = room.members?.filter(m => m.attendance === 'JOIN').length ?? 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* 로고 */}
        <div>
          <div className="text-5xl mb-2">🍚</div>
          <p className="text-gray-500 text-sm">밥빵 초대장</p>
        </div>

        {/* 초대한 사람 */}
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {room.leader.name}님이<br />초대했어요!
          </p>
          <p className="text-gray-500 text-sm mt-1">{room.leader.team}</p>
        </div>

        {/* 약속 정보 카드 */}
        <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <span>📅</span>
            <span className="text-sm font-medium">{formatMealTime(room.mealTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>👥</span>
            <span className="text-sm">현재 {joinCount}명 참여 예정</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📍</span>
            <span className="text-sm">도보 {room.maxWalkMinutes}분 이내 식당</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>{room.selectionMode === 'VOTE' ? '🗳️' : '👑'}</span>
            <span className="text-sm">
              {room.selectionMode === 'VOTE' ? '투표로 식당 결정' : '리더가 식당 선택'}
            </span>
          </div>
        </div>

        {/* 현재 참여 멤버 미리보기 */}
        {room.members && room.members.length > 0 && (
          <div className="flex items-center justify-center gap-1">
            {room.members.filter(m => m.attendance === 'JOIN').slice(0, 4).map(m => (
              <div
                key={m.userId}
                className="w-9 h-9 rounded-full bg-primary-400 text-white flex items-center justify-center text-sm font-bold -ml-1 first:ml-0 border-2 border-white"
                title={m.user.name}
              >
                {m.user.name[0]}
              </div>
            ))}
            {joinCount > 4 && (
              <span className="text-xs text-gray-400 ml-1">+{joinCount - 4}명</span>
            )}
            {joinCount > 0 && (
              <span className="text-sm text-gray-500 ml-2">참여 중</span>
            )}
          </div>
        )}

        {/* CTA 버튼 */}
        {isAlreadyMember ? (
          <button
            onClick={handleAlreadyMember}
            className="w-full py-4 bg-primary-500 text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform"
          >
            계속하기 →
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full py-4 bg-primary-500 text-white font-bold text-lg rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isJoining ? '입장 중...' : '🙋 참여하기'}
          </button>
        )}

        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 underline"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  )
}
