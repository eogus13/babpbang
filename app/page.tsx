'use client'

// ============================================================
// app/page.tsx — 홈 화면 (컴포넌트 연결 완료)
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { getRoomsByUser } from '@/lib/api'
import RoomStatusCard from '@/components/RoomStatusCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Room } from '@/types/api'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [activeRooms, setActiveRooms] = useState<Room[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)

  // 온보딩 안 됐으면 리다이렉트
  useEffect(() => {
    if (!isLoading && !user) {
      // 초대 링크를 통해 온 경우 복귀 경로 확인
      const redirect = sessionStorage.getItem('babpbang_redirect')
      if (redirect) {
        sessionStorage.removeItem('babpbang_redirect')
        router.replace(redirect)
        return
      }
      router.replace('/onboarding')
    }
  }, [user, isLoading, router])

  // 진행 중인 밥약속 불러오기
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setRoomsLoading(true)
      try {
        const data = await getRoomsByUser(user.id)
        setActiveRooms(data.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED'))
      } catch {
        setActiveRooms([])
      } finally {
        setRoomsLoading(false)
      }
    }
    load()
  }, [user])

  if (isLoading || !user) return null

  const completedRooms: Room[] = [] // 완료된 방은 별도 섹션 (필요 시 확장)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">🍚 밥빵</h1>
        <button
          onClick={() => router.push('/onboarding')}
          className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5"
        >
          <div className="w-5 h-5 rounded-full bg-primary-400 text-white flex items-center justify-center text-xs font-bold">
            {user.name[0]}
          </div>
          <span className="text-xs font-medium text-gray-600">{user.name} · {user.team}</span>
        </button>
      </header>

      <main className="flex-1 px-5 py-5 space-y-6 pb-28">
        {/* 진행 중인 약속 */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            지금 진행 중
          </h2>

          {roomsLoading ? (
            <LoadingSpinner message="밥약속 확인 중..." size="sm" />
          ) : activeRooms.length === 0 ? (
            <EmptyState
              emoji="🍽️"
              title="진행 중인 밥약속이 없어요"
              description="새 약속을 만들거나 초대 링크를 받아보세요"
            />
          ) : (
            <div className="space-y-3">
              {activeRooms.map(room => (
                <RoomStatusCard
                  key={room.id}
                  room={room}
                  isLeader={room.leaderId === user.id}
                  onClick={() => {
                    // 현재 단계에 맞는 화면으로 이동
                    const routes: Record<string, string> = {
                      WAITING_ATTENDANCE:   `/room/${room.id}/invite`,
                      SELECTING_RESTAURANT: `/room/${room.id}/restaurants`,
                      RESTAURANT_CONFIRMED: `/room/${room.id}/menu`,
                      COMPLETED:            `/room/${room.id}/summary`,
                    }
                    router.push(routes[room.status] ?? `/room/${room.id}/invite`)
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* 지난 약속 */}
        {completedRooms.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              지난 약속
            </h2>
            <div className="space-y-2">
              {completedRooms.slice(0, 5).map(room => (
                <button
                  key={room.id}
                  onClick={() => router.push(`/room/${room.id}/summary`)}
                  className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 text-left active:scale-95 transition-transform"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(room.mealTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {room.confirmedRestaurant?.name ?? '식당 미정'} · {room.members?.filter(m => m.attendance === 'JOIN').length ?? 0}명
                      </p>
                    </div>
                    <span className="text-gray-300">→</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 하단 새 밥약속 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-5 py-4 bg-white border-t border-gray-100 pb-safe">
        <Link
          href="/room/new"
          className="block w-full py-4 bg-primary-500 text-white font-bold text-center text-lg rounded-2xl active:scale-95 transition-transform"
        >
          + 새 밥약속 만들기
        </Link>
      </div>
    </div>
  )
}
