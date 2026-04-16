'use client'

// ============================================================
// app/restaurant/[id]/page.tsx — 식당 상세 (컴포넌트 연결 완료)
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getRestaurantById, voteRestaurant, cancelVote, confirmRestaurant, getRestaurantVotes } from '@/lib/api'
import VoteBar from '@/components/VoteBar'
import BottomButton from '@/components/ui/BottomButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Restaurant, VoteSummary } from '@/types/api'

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()

  const roomId = searchParams.get('roomId') ?? ''
  const mode = searchParams.get('mode') as 'vote' | 'leader' | null

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [voteSummary, setVoteSummary] = useState<VoteSummary[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const isVoteMode = mode === 'vote'
  const myVote = voteSummary.find(v => v.myVote)
  const hasMyVoteHere = myVote?.restaurantId === params.id
  const thisVote = voteSummary.find(v => v.restaurantId === params.id)
  const isLeading = voteSummary[0]?.restaurantId === params.id && (thisVote?.voteCount ?? 0) > 0

  useEffect(() => {
    const load = async () => {
      setPageLoading(true)
      try {
        const [restaurantData, voteData] = await Promise.all([
          getRestaurantById(params.id),
          isVoteMode && roomId
            ? getRestaurantVotes(roomId)
            : Promise.resolve({ summary: [], totalVotes: 0 }),
        ])
        setRestaurant(restaurantData)
        setVoteSummary(voteData.summary)
        setTotalVotes(voteData.totalVotes)
      } catch (err) {
        console.error('식당 상세 로드 실패', err)
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [params.id, isVoteMode, roomId])

  const handleVote = async () => {
    if (!user || !roomId) return
    setIsLoading(true)
    try {
      if (hasMyVoteHere) {
        await cancelVote(roomId, user.id)
      } else {
        await voteRestaurant(roomId, user.id, params.id)
      }
      const voteData = await getRestaurantVotes(roomId)
      setVoteSummary(voteData.summary)
      setTotalVotes(voteData.totalVotes)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!user || !roomId) return
    setIsLoading(true)
    try {
      await confirmRestaurant(roomId, user.id, params.id)
      router.push(`/room/${roomId}/menu`)
    } finally {
      setIsLoading(false)
    }
  }

  if (pageLoading) return <LoadingSpinner message="식당 정보 불러오는 중..." />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
          <h1 className="text-lg font-bold text-gray-900">식당 정보</h1>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isVoteMode ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
        }`}>
          {isVoteMode ? '🗳️ 투표중' : '👑 리더 선택'}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        {/* 식당 이미지 */}
        <div className="h-52 bg-gray-200 flex items-center justify-center overflow-hidden">
          {restaurant?.imageUrl ? (
            <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-7xl">🍽️</span>
          )}
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* 기본 정보 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {restaurant?.name ?? '식당 이름'}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-yellow-400 text-lg">★</span>
              <span className="font-semibold text-gray-700">{restaurant?.rating?.toFixed(1) ?? '4.3'}</span>
              <span className="text-gray-400 text-sm">({restaurant?.reviewCount ?? 0}개)</span>
              {restaurant?.distanceMinutes && (
                <span className="text-gray-400 text-sm">· 🚶 {restaurant.distanceMinutes}분</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-sm text-gray-500">
            {restaurant?.address && <p>📍 {restaurant.address}</p>}
            {restaurant?.businessHours && <p>🕐 {restaurant.businessHours}</p>}
            {restaurant?.phone && <p>☎ {restaurant.phone}</p>}
          </div>

          {/* 메뉴 목록 */}
          {restaurant?.menus && restaurant.menus.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3">주요 메뉴</h3>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
                {restaurant.menus.map((menu, i) => (
                  <div key={menu.id} className={`flex justify-between items-center px-4 py-3 ${
                    i < restaurant.menus!.length - 1 ? 'border-b border-gray-50' : ''
                  }`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{menu.name}</p>
                      {menu.menuCategory && (
                        <p className="text-xs text-gray-400">{menu.menuCategory}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-primary-600">
                      {menu.price.toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 투표 현황 (투표 모드) */}
          {isVoteMode && voteSummary.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3">전체 투표 현황</h3>
              <div className="space-y-2">
                {voteSummary.map((v, i) => (
                  <VoteBar
                    key={v.restaurantId}
                    restaurantName={v.restaurant.name}
                    voteCount={v.voteCount}
                    totalVotes={totalVotes}
                    voters={v.voters.map(u => u.name)}
                    isMyVote={v.myVote}
                    isLeading={i === 0 && v.voteCount > 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 하단 CTA */}
      {isVoteMode ? (
        <BottomButton
          label={hasMyVoteHere ? '👍 투표 취소하기' : '👍 이 식당 추천해요!'}
          variant={hasMyVoteHere ? 'secondary' : 'primary'}
          onClick={handleVote}
          isLoading={isLoading}
        />
      ) : (
        <BottomButton
          label="👑 여기서 먹어요! 확정"
          onClick={handleConfirm}
          isLoading={isLoading}
          disabled={user?.id === undefined}
          subText={user?.id === undefined ? '리더만 식당을 확정할 수 있어요' : undefined}
        />
      )}
    </div>
  )
}
