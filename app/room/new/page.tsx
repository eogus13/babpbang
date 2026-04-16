'use client'

// ============================================================
// app/room/new/page.tsx
// 밥약속 만들기 — 시간/팀/거리/식당 선정 방식 설정
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { createRoom } from '@/lib/api'
import type { SelectionMode } from '@/types/api'

export default function NewRoomPage() {
  const router = useRouter()
  const { user } = useUser()

  const [mealTime, setMealTime] = useState(() => {
    // 기본값: 오늘 12:00
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d.toISOString().slice(0, 16)   // datetime-local 형식
  })
  const [maxWalkMinutes, setMaxWalkMinutes] = useState(10)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('VOTE')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      // 위치 정보 가져오기 (없으면 null로)
      let lat: number | undefined, lng: number | undefined
      if (navigator.geolocation) {
        await new Promise<void>(resolve => {
          navigator.geolocation.getCurrentPosition(
            pos => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve() },
            () => resolve(),    // 위치 거부해도 계속 진행
            { timeout: 3000 }
          )
        })
      }

      const room = await createRoom({
        leaderId: user.id,
        mealTime: new Date(mealTime).toISOString(),
        selectionMode,
        maxWalkMinutes,
        lat,
        lng,
      })
      router.push(`/room/${room.id}/invite`)
    } catch (e) {
      setError('밥약속 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-lg font-bold text-gray-900">새 밥약속 만들기</h1>
      </header>

      <main className="flex-1 px-5 py-6 space-y-7">
        {/* 식사 시간 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">식사 시간</label>
          <input
            type="datetime-local"
            value={mealTime}
            onChange={e => setMealTime(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
          />
        </div>

        {/* 이동 가능 거리 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            이동 가능 거리 <span className="font-normal text-primary-500">도보 {maxWalkMinutes}분 이내</span>
          </label>
          <input
            type="range"
            min={5} max={30} step={5}
            value={maxWalkMinutes}
            onChange={e => setMaxWalkMinutes(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5분</span><span>15분</span><span>30분</span>
          </div>
        </div>

        {/* 식당 선정 방식 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">식당 어떻게 고를까요?</label>
          <div className="space-y-3">
            <button
              onClick={() => setSelectionMode('VOTE')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                selectionMode === 'VOTE'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🗳️</span>
                <div>
                  <p className={`font-semibold ${selectionMode === 'VOTE' ? 'text-primary-700' : 'text-gray-800'}`}>
                    다같이 투표해서 정해요
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    팀원들이 원하는 식당에 각자 투표 → 최다 득표 확정
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectionMode('LEADER')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                selectionMode === 'LEADER'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">👑</span>
                <div>
                  <p className={`font-semibold ${selectionMode === 'LEADER' ? 'text-primary-700' : 'text-gray-800'}`}>
                    내가 바로 정할게요
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    리더(나)가 식당 목록 보고 직접 한 곳 선택
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </main>

      {/* 생성 버튼 */}
      <div className="sticky bottom-0 px-5 py-4 bg-white border-t border-gray-100 pb-safe">
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full py-4 bg-primary-500 text-white font-bold text-lg rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isLoading ? '생성 중...' : '밥약속 만들기! 🍽️'}
        </button>
      </div>
    </div>
  )
}
