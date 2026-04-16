'use client'

// ============================================================
// app/room/[id]/vote/page.tsx
// 참여 여부 투표 화면 (먹을게요 / 오늘은 패스)
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getRoomById, respondAttendance } from '@/lib/api'
import type { Room } from '@/types/api'

export default function VotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRoomById(params.id)
        setRoom(data)
      } catch (err) {
        console.error('방 정보 로드 실패', err)
      }
    }
    load()
  }, [params.id])

  const handleVote = async (attendance: 'JOIN' | 'SKIP') => {
    if (!user || !room) return
    setIsLoading(true)
    try {
      await respondAttendance(room.id, user.id, attendance)
      setVoted(true)
      if (attendance === 'JOIN') {
        // 참여 선택 → 식당 추천으로 이동
        setTimeout(() => router.push(`/room/${room.id}/restaurants`), 800)
      } else {
        // 불참 → 홈으로
        setTimeout(() => router.push('/'), 800)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const joinCount = room?.members?.filter(m => m.attendance === 'JOIN').length ?? 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* 로고 */}
        <div className="text-5xl">🍚</div>

        {/* 초대 메시지 */}
        <div>
          <p className="text-xl font-bold text-gray-900">
            {room?.leader?.name ?? '...'}님이 초대했어요!
          </p>
        </div>

        {/* 약속 정보 */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-2 text-left">
          <div className="flex items-center gap-2 text-gray-600">
            <span>📅</span>
            <span className="text-sm">
              {room?.mealTime ? new Date(room.mealTime).toLocaleString('ko-KR', {
                month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : '...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>👥</span>
            <span className="text-sm">현재 {joinCount}명 참여 예정</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📍</span>
            <span className="text-sm">도보 {room?.maxWalkMinutes ?? 10}분 이내 식당</span>
          </div>
        </div>

        {/* 투표 버튼 */}
        {!voted ? (
          <div className="space-y-3 w-full">
            <p className="font-semibold text-gray-700">같이 밥 먹을래요?</p>
            <button
              onClick={() => handleVote('JOIN')}
              disabled={isLoading}
              className="w-full py-4 bg-primary-500 text-white font-bold text-lg rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              🙋 먹을게요!
            </button>
            <button
              onClick={() => handleVote('SKIP')}
              disabled={isLoading}
              className="w-full py-4 bg-gray-100 text-gray-600 font-semibold text-lg rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              🙅 오늘은 패스
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600">응답 완료! 잠시 후 이동합니다...</p>
          </div>
        )}
      </div>
    </div>
  )
}
