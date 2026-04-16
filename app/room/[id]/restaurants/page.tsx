'use client'

// ============================================================
// app/room/[id]/restaurants/page.tsx — 식당 추천 목록 (컴포넌트 연결 완료)
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getRoomById, getNearbyRestaurants, getRestaurantVotes } from '@/lib/api'
import RestaurantCard from '@/components/RestaurantCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { Restaurant, Room, VoteSummary } from '@/types/api'

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '분식']

export default function RestaurantsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [room, setRoom] = useState<Room | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [voteSummary, setVoteSummary] = useState<VoteSummary[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [isLoading, setIsLoading] = useState(true)

  const isVoteMode = room?.selectionMode === 'VOTE'
  const myVoteRestaurantId = voteSummary.find(v => v.myVote)?.restaurantId ?? null

  // 방 정보 로드 (최초 1회)
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const data = await getRoomById(params.id)
        setRoom(data)
      } catch (err) {
        console.error('방 정보 로드 실패', err)
      }
    }
    loadRoom()
  }, [params.id])

  // 식당 목록 + 투표 현황 로드 (카테고리/room 변경 시)
  useEffect(() => {
    if (!room) return
    const loadAll = async () => {
      setIsLoading(true)
      try {
        // 방 생성 시 저장된 위치 사용, 없으면 서울 중심부 fallback
        const lat = room.lat ?? 37.5665
        const lng = room.lng ?? 126.9780
        const [restaurantData, voteData] = await Promise.all([
          getNearbyRestaurants({
            lat, lng,
            maxMinutes: room.maxWalkMinutes ?? 10,
            ...(selectedCategory !== '전체' ? { category: selectedCategory } : {}),
          }),
          isVoteMode ? getRestaurantVotes(params.id) : Promise.resolve({ summary: [], totalVotes: 0 }),
        ])
        setRestaurants(restaurantData.restaurants)
        setVoteSummary(voteData.summary)
      } finally {
        setIsLoading(false)
      }
    }
    loadAll()
  }, [selectedCategory, room, isVoteMode, params.id])

  // 투표 모드: 득표 수 맵
  const voteCountMap = new Map(voteSummary.map(v => [v.restaurantId, v.voteCount]))

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="text-lg font-bold text-gray-900">식당 고르기</h1>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isVoteMode
            ? 'bg-blue-50 text-blue-600'
            : 'bg-orange-50 text-orange-600'
        }`}>
          {isVoteMode ? '🗳️ 투표 중' : '👑 리더 선택'}
        </span>
      </header>

      {/* 카테고리 필터 */}
      <div className="bg-white px-5 py-3 flex gap-2 overflow-x-auto border-b border-gray-100">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 위치 안내 */}
      <div className="px-5 py-2 bg-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
        <span>📍</span>
        <span>현재 위치 기준 도보 {room?.maxWalkMinutes ?? 10}분 이내 · {restaurants.length}개</span>
      </div>

      {/* 식당 목록 */}
      <main className="flex-1 px-5 py-4 pb-6">
        {isLoading ? (
          <LoadingSpinner message="근처 식당 찾는 중..." />
        ) : restaurants.length === 0 ? (
          <EmptyState
            emoji="🗺️"
            title="근처에 식당이 없어요"
            description="이동 거리를 늘리거나 다른 카테고리를 선택해보세요"
          />
        ) : (
          <div className="space-y-3">
            {restaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                voteCount={isVoteMode ? (voteCountMap.get(restaurant.id) ?? 0) : undefined}
                isMyVote={myVoteRestaurantId === restaurant.id}
                onClick={() => router.push(
                  `/restaurant/${restaurant.id}?roomId=${params.id}&mode=${isVoteMode ? 'vote' : 'leader'}`
                )}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
