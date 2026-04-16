'use client'

// ============================================================
// components/MemberCard.tsx
// 팀원 카드 — 초대 현황, 메뉴 선택 현황에서 사용
// ============================================================

import type { AttendanceStatus } from '@/types/api'

interface MemberCardProps {
  name: string
  team: string
  isLeader?: boolean
  // 참여 여부 모드
  attendance?: AttendanceStatus
  // 메뉴 선택 모드
  selectedMenus?: string[]   // 메뉴 이름 배열
  isMe?: boolean
}

const ATTENDANCE_CONFIG: Record<AttendanceStatus, { icon: string; label: string; color: string }> = {
  PENDING: { icon: '❓', label: '대기 중',   color: 'text-gray-400' },
  JOIN:    { icon: '✅', label: '먹을게요',  color: 'text-green-600' },
  SKIP:    { icon: '❌', label: '안 먹어요', color: 'text-red-400'   },
}

export default function MemberCard({
  name,
  team,
  isLeader = false,
  attendance,
  selectedMenus,
  isMe = false,
}: MemberCardProps) {
  const attendanceInfo = attendance ? ATTENDANCE_CONFIG[attendance] : null

  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
      isMe ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
    }`}>
      {/* 왼쪽: 이름 + 팀 */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">
          {name[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className={`font-medium text-sm ${isMe ? 'text-primary-700' : 'text-gray-800'}`}>
              {name}
            </span>
            {isMe && <span className="text-xs text-primary-400">(나)</span>}
            {isLeader && <span className="text-xs">👑</span>}
          </div>
          <span className="text-xs text-gray-400">{team}</span>
        </div>
      </div>

      {/* 오른쪽: 참여 여부 또는 메뉴 */}
      <div className="flex-shrink-0 ml-3">
        {attendanceInfo && (
          <div className="flex items-center gap-1">
            <span>{attendanceInfo.icon}</span>
            <span className={`text-sm ${attendanceInfo.color}`}>{attendanceInfo.label}</span>
          </div>
        )}
        {selectedMenus !== undefined && (
          <div className="text-right">
            {selectedMenus.length > 0 ? (
              <span className="text-xs text-gray-600 max-w-[120px] truncate block">
                {selectedMenus.join(', ')}
              </span>
            ) : (
              <span className="text-xs text-orange-400">선택 중...</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 사용 예시:
 *
 * // 참여 여부 현황
 * <MemberCard name="홍길동" team="조명팀" isLeader isMe attendance="JOIN" />
 * <MemberCard name="김철수" team="카메라팀" attendance="PENDING" />
 *
 * // 메뉴 선택 현황
 * <MemberCard name="홍길동" team="조명팀" isMe selectedMenus={['목살 1인분']} />
 * <MemberCard name="김철수" team="카메라팀" selectedMenus={[]} />
 */
