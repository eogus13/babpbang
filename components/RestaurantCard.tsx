'use client'

// ============================================================
// components/RestaurantCard.tsx
// 식당 카드 — 추천 목록, 식당 상세 진입점
// 투표 현황(voteCount)도 옵셔널로 표시 가능
// ============================================================

import type { Restaurant } from '@/types/api'

interface RestaurantCardProps {
  restaurant: Restaurant
  onClick?: () => void
  // 투표 모드에서 현재 득표 수 표시 (선택)
  voteCount?: number
  isMyVote?: boolean
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
      <span className="text-xs text-gray-400 ml-1">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function RestaurantCard({
  restaurant,
  onClick,
  voteCount,
  isMyVote = false,
}: RestaurantCardProps) {
  const { name, category, rating, distanceMinutes, imageUrl, menus } = restaurant
  const lowestPrice = menus && menus.length > 0
    ? Math.min(...menus.map(m => m.price))
    : null

  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-2xl border-2 overflow-hidden text-left active:scale-95 transition-all ${
        isMyVote ? 'border-primary-500 shadow-md' : 'border-gray-100 shadow-sm'
      }`}
    >
      {/* 이미지 영역 */}
      <div className="relative h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🍽️</span>
        )}

        {/* 카테고리 배지 */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          {category}
        </span>

        {/* 내 투표 표시 */}
        {isMyVote && (
          <span className="absolute top-2 right-2 bg-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            👍 내 선택
          </span>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{name}</h3>
          {voteCount !== undefined && voteCount > 0 && (
            <span className="flex-shrink-0 bg-primary-100 text-primary-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {voteCount}표
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <StarRating rating={rating} />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {distanceMinutes !== undefined && (
              <span>🚶 {distanceMinutes}분</span>
            )}
            {lowestPrice !== null && (
              <span>💰 {lowestPrice.toLocaleString()}원~</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/**
 * 사용 예시:
 *
 * import RestaurantCard from '@/components/RestaurantCard'
 *
 * // 기본
 * <RestaurantCard
 *   restaurant={restaurant}
 *   onClick={() => router.push(`/restaurant/${restaurant.id}?roomId=${roomId}&mode=vote`)}
 * />
 *
 * // 투표 현황 표시
 * <RestaurantCard
 *   restaurant={restaurant}
 *   voteCount={3}
 *   isMyVote={myVoteId === restaurant.id}
 *   onClick={...}
 * />
 */
