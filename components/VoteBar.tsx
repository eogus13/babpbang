'use client'

// ============================================================
// components/VoteBar.tsx
// 투표 현황 바 — 식당별 득표 수를 시각적으로 보여줌
// ============================================================

interface VoteBarProps {
  restaurantName: string
  voteCount: number
  totalVotes: number
  voters: string[]       // 투표한 사람 이름 목록
  isMyVote?: boolean
  isLeading?: boolean    // 현재 1위
}

export default function VoteBar({
  restaurantName,
  voteCount,
  totalVotes,
  voters,
  isMyVote = false,
  isLeading = false,
}: VoteBarProps) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0

  return (
    <div className={`rounded-xl p-3 ${isLeading ? 'bg-primary-50' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isLeading && <span className="text-sm">🏆</span>}
          <span className={`text-sm font-semibold ${isLeading ? 'text-primary-700' : 'text-gray-700'}`}>
            {restaurantName}
          </span>
          {isMyVote && (
            <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">내 선택</span>
          )}
        </div>
        <span className={`text-sm font-bold ${isLeading ? 'text-primary-600' : 'text-gray-500'}`}>
          {voteCount}표
        </span>
      </div>

      {/* 진행 바 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isLeading ? 'bg-primary-500' : 'bg-gray-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 투표한 사람들 */}
      {voters.length > 0 && (
        <p className="text-xs text-gray-400 mt-1.5">
          👍 {voters.join(', ')}
        </p>
      )}
    </div>
  )
}

/**
 * 사용 예시:
 *
 * {voteSummary.map((v, i) => (
 *   <VoteBar
 *     key={v.restaurantId}
 *     restaurantName={v.restaurant.name}
 *     voteCount={v.voteCount}
 *     totalVotes={totalVotes}
 *     voters={v.voters.map(u => u.name)}
 *     isMyVote={v.myVote}
 *     isLeading={i === 0}
 *   />
 * ))}
 */
