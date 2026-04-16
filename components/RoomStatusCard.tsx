'use client'

// ============================================================
// components/RoomStatusCard.tsx
// 진행 중인 밥약속 카드 — 홈 화면에서 현재 상태 한눈에 표시
// ============================================================

import type { Room, RoomStatus } from '@/types/api'

interface RoomStatusCardProps {
  room: Room
  onClick: () => void
  isLeader?: boolean
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bgColor: string; emoji: string }> = {
  WAITING_ATTENDANCE:    { label: '참여 여부 투표 중',  color: 'text-blue-600',   bgColor: 'bg-blue-50',   emoji: '🙋' },
  SELECTING_RESTAURANT:  { label: '식당 선정 중',       color: 'text-orange-600', bgColor: 'bg-orange-50', emoji: '🗺️' },
  RESTAURANT_CONFIRMED:  { label: '메뉴 선택 중',       color: 'text-green-600',  bgColor: 'bg-green-50',  emoji: '🍽️' },
  COMPLETED:             { label: '완료',               color: 'text-gray-500',   bgColor: 'bg-gray-50',   emoji: '✅' },
  CANCELLED:             { label: '취소됨',             color: 'text-red-400',    bgColor: 'bg-red-50',    emoji: '❌' },
}

function formatMealTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const hour = d.getHours()
  const mealLabel = hour < 11 ? '아침' : hour < 15 ? '점심' : '저녁'
  return isToday ? `오늘 ${mealLabel} ${time}` : `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

export default function RoomStatusCard({ room, onClick, isLeader = false }: RoomStatusCardProps) {
  const config = STATUS_CONFIG[room.status]
  const joinCount = room.members?.filter(m => m.attendance === 'JOIN').length ?? 0
  const totalCount = room.members?.length ?? 0

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:scale-95 transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        {/* 왼쪽 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.emoji}</span>
            <p className="font-bold text-gray-900 truncate">
              {formatMealTime(room.mealTime)}
            </p>
            {isLeader && <span className="text-xs text-primary-500">👑 내가 만든</span>}
          </div>

          {/* 참여 현황 */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>👥 {joinCount}/{totalCount}명 참여</span>
            {room.confirmedRestaurant && (
              <span>📍 {room.confirmedRestaurant.name}</span>
            )}
          </div>

          {/* 멤버 아바타 미리보기 */}
          {room.members && room.members.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {room.members.slice(0, 5).map(m => (
                <div
                  key={m.userId}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold -ml-1 first:ml-0 border-2 border-white ${
                    m.attendance === 'JOIN' ? 'bg-primary-400 text-white' :
                    m.attendance === 'SKIP' ? 'bg-gray-200 text-gray-400' :
                    'bg-yellow-200 text-yellow-600'
                  }`}
                >
                  {m.user.name[0]}
                </div>
              ))}
              {room.members.length > 5 && (
                <span className="text-xs text-gray-400 ml-1">+{room.members.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 상태 배지 + 화살표 */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} ${config.bgColor}`}>
            {config.label}
          </span>
          <span className="text-gray-300 text-lg">→</span>
        </div>
      </div>
    </button>
  )
}

/**
 * 사용 예시:
 *
 * {activeRooms.map(room => (
 *   <RoomStatusCard
 *     key={room.id}
 *     room={room}
 *     isLeader={room.leaderId === user?.id}
 *     onClick={() => router.push(`/room/${room.id}/invite`)}
 *   />
 * ))}
 */
