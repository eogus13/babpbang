'use client'

// ============================================================
// app/room/[id]/summary/page.tsx
// 최종 요약 — 오늘 점심 확정! 누가 뭐 먹는지 한눈에
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRoomSummary } from '@/lib/api'
import type { RoomSummary } from '@/types/api'

export default function SummaryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [summary, setSummary] = useState<RoomSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shareSuccess, setShareSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRoomSummary(params.id)
        setSummary(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.id])

  const handleShare = async () => {
    if (!summary) return
    const text = [
      `🍚 밥빵 오늘 점심 확정!`,
      `📍 ${summary.restaurant?.name}`,
      `🕐 ${new Date(summary.room.mealTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`,
      '',
      ...summary.memberMenus.map(m =>
        `${m.user.name}: ${m.menus.map(menu => menu.name).join(', ')}`
      ),
      '',
      `💰 총 예상 ${summary.totalEstimatedPrice.toLocaleString()}원`,
      `(1인당 약 ${Math.round(summary.totalEstimatedPrice / summary.totalParticipants).toLocaleString()}원)`,
    ].join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🍚</div>
          <p className="text-sm">요약 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-4 text-center bg-gradient-to-b from-primary-50 to-white">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">오늘 점심 확정!</h1>
      </div>

      <main className="flex-1 px-5 py-4 space-y-5 pb-32">
        {/* 식당 정보 */}
        <div className="bg-primary-50 rounded-2xl p-5">
          <h2 className="text-xl font-bold text-primary-700">{summary?.restaurant?.name}</h2>
          <div className="mt-3 space-y-1.5 text-sm text-primary-600">
            <p>🕐 {new Date(summary?.room?.mealTime ?? '').toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · 👥 {summary?.totalParticipants}명</p>
            {summary?.restaurant?.address && <p>📍 {summary.restaurant.address}</p>}
            {summary?.restaurant?.distanceMinutes && <p>🚶 도보 {summary.restaurant.distanceMinutes}분</p>}
          </div>
        </div>

        {/* 팀원별 메뉴 */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">각자 메뉴</h3>
          <div className="space-y-2">
            {summary?.memberMenus.map(m => (
              <div key={m.user.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      👤 {m.user.name}
                      <span className="ml-1.5 text-xs text-gray-400">{m.user.team}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {m.menus.length > 0
                        ? m.menus.map(menu => menu.name).join(' + ')
                        : <span className="text-gray-400 italic">메뉴 미선택</span>
                      }
                    </p>
                  </div>
                  {m.totalPrice > 0 && (
                    <p className="text-sm font-semibold text-gray-500">
                      {m.totalPrice.toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 총 금액 */}
        {summary && summary.totalEstimatedPrice > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500">💰 총 예상 금액</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.totalEstimatedPrice.toLocaleString()}원
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              (1인당 약 {Math.round(summary.totalEstimatedPrice / summary.totalParticipants).toLocaleString()}원)
            </p>
          </div>
        )}

        {/* 맛있게 드세요 */}
        <div className="text-center py-4">
          <p className="text-2xl">🍚</p>
          <p className="text-gray-500 mt-1 font-medium">맛있게 드세요!</p>
        </div>
      </main>

      {/* 하단 버튼들 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-5 py-4 bg-white border-t border-gray-100 pb-safe space-y-2">
        <button
          onClick={handleShare}
          className="w-full py-3.5 border-2 border-primary-500 text-primary-500 font-semibold rounded-2xl active:scale-95 transition-transform"
        >
          {shareSuccess ? '✅ 복사됨!' : '💬 공유하기'}
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-2xl active:scale-95 transition-transform"
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
