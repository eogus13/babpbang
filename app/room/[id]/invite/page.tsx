'use client'

// ============================================================
// app/room/[id]/invite/page.tsx — 초대 공유 + 실시간 참여 현황
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getRoomById } from '@/lib/api'
import MemberCard from '@/components/MemberCard'
import BottomButton from '@/components/ui/BottomButton'
import type { Room } from '@/types/api'

export default function InvitePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [room, setRoom] = useState<Room | null>(null)
  const [copied, setCopied] = useState(false)

  const loadRoom = useCallback(async () => {
    try {
      const data = await getRoomById(params.id)
      setRoom(data)
      // 모든 팀원이 응답 완료 → 식당 선택 단계로 자동 이동
      if (data.status === 'SELECTING_RESTAURANT') {
        router.replace(`/room/${params.id}/restaurants`)
      }
    } catch (err) {
      console.error('방 정보 로드 실패', err)
    }
  }, [params.id, router])

  useEffect(() => {
    loadRoom()
    const interval = setInterval(loadRoom, 5000) // 5초마다 현황 갱신
    return () => clearInterval(interval)
  }, [loadRoom])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteUrl = `${appUrl}/join/${room?.code ?? ''}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: '밥빵 초대', text: `같이 밥 먹어요! 👉 ${inviteUrl}` })
    } else {
      handleCopy()
    }
  }

  const joinCount = room?.members?.filter(m => m.attendance === 'JOIN').length ?? 0
  const pendingCount = room?.members?.filter(m => m.attendance === 'PENDING').length ?? 0
  const isLeader = user?.id === room?.leaderId

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">팀원 초대</h1>
          {pendingCount > 0 && (
            <p className="text-xs text-orange-400">{pendingCount}명 응답 대기 중...</p>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-5 space-y-5 pb-28">
        {/* 초대 코드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">초대 코드</p>
          <p className="text-4xl font-black tracking-widest text-primary-500 font-mono">
            {room?.code ?? '------'}
          </p>
          <p className="text-xs text-gray-400 mt-2">이 코드를 팀원들에게 알려주세요</p>
        </div>

        {/* 공유 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-xl text-sm active:scale-95 transition-transform"
          >
            {copied ? '✅ 복사됨!' : '📋 링크 복사'}
          </button>
          <button
            onClick={handleShare}
            className="py-3 bg-yellow-400 text-yellow-900 font-semibold rounded-xl text-sm active:scale-95 transition-transform"
          >
            💬 카카오 공유
          </button>
        </div>

        {/* 참여 현황 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              참여 현황
            </h2>
            <span className="text-sm font-semibold text-primary-500">
              {joinCount}명 참여 예정
            </span>
          </div>

          {!room?.members || room.members.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-8 text-center text-gray-400">
              <p className="text-2xl mb-1">👥</p>
              <p className="text-sm">아직 아무도 없어요</p>
              <p className="text-xs mt-1">링크를 공유해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {room.members.map(m => (
                <MemberCard
                  key={m.userId}
                  name={m.user.name}
                  team={m.user.team}
                  isLeader={m.userId === room.leaderId}
                  isMe={m.userId === user?.id}
                  attendance={m.attendance}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomButton
        label="식당 찾기 시작 →"
        onClick={() => router.push(`/room/${params.id}/restaurants`)}
        disabled={joinCount < 1 || !isLeader}
        subText={!isLeader ? '리더가 시작하면 자동으로 넘어가요' : joinCount < 1 ? '1명 이상 참여해야 시작할 수 있어요' : undefined}
      />
    </div>
  )
}
