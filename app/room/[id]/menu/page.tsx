'use client'

// ============================================================
// app/room/[id]/menu/page.tsx — 메뉴 선택 (컴포넌트 연결 완료)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { getRoomById, selectMenus, getMenuSelections } from '@/lib/api'
import MenuCard from '@/components/MenuCard'
import MemberCard from '@/components/MemberCard'
import BottomButton from '@/components/ui/BottomButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Room, Menu } from '@/types/api'

export default function MenuPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [room, setRoom] = useState<Room | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [memberSelections, setMemberSelections] = useState<{ user: any; menus: Menu[]; totalPrice: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const menus = room?.confirmedRestaurant?.menus ?? []
  const menusByCategory = menus.reduce<Record<string, Menu[]>>((acc, menu) => {
    const cat = menu.menuCategory ?? '메뉴'
    acc[cat] = acc[cat] ?? []
    acc[cat].push(menu)
    return acc
  }, {})

  const loadSelections = useCallback(async () => {
    try {
      const data = await getMenuSelections(params.id) as any
      setMemberSelections(data.memberMenus ?? [])
    } catch {}
  }, [params.id])

  useEffect(() => {
    // 방 정보(확정 식당 + 메뉴 포함) + 선택 현황 동시 로드
    const load = async () => {
      setPageLoading(true)
      try {
        const [roomData] = await Promise.all([
          getRoomById(params.id),
          loadSelections(),
        ])
        setRoom(roomData)
      } catch (err) {
        console.error('메뉴 페이지 로드 실패', err)
      } finally {
        setPageLoading(false)
      }
    }
    load()
    const interval = setInterval(loadSelections, 5000)
    return () => clearInterval(interval)
  }, [params.id, loadSelections])

  const toggleMenu = (menuId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(menuId) ? next.delete(menuId) : next.add(menuId)
      return next
    })
  }

  const handleConfirm = async () => {
    if (!user || selectedIds.size === 0) return
    setIsLoading(true)
    try {
      const result = await selectMenus(params.id, user.id, Array.from(selectedIds)) as any
      if (result.allCompleted) {
        router.push(`/room/${params.id}/summary`)
      } else {
        await loadSelections() // 현황 새로고침
      }
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = Array.from(selectedIds).reduce((sum, id) => {
    const menu = menus.find(m => m.id === id)
    return sum + (menu?.price ?? 0)
  }, 0)

  if (pageLoading) return <LoadingSpinner message="메뉴 불러오는 중..." />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white px-5 py-4 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">메뉴 고르기</h1>
          {room?.confirmedRestaurant && (
            <p className="text-xs text-gray-400">{room.confirmedRestaurant.name}</p>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-5 space-y-6 pb-32">
        <p className="text-gray-600 font-semibold">{user?.name}님, 뭐 드실래요?</p>

        {/* 카테고리별 메뉴 목록 */}
        {Object.entries(menusByCategory).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">── {category}</p>
            <div className="space-y-2">
              {items.map(menu => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  isSelected={selectedIds.has(menu.id)}
                  onToggle={toggleMenu}
                />
              ))}
            </div>
          </div>
        ))}

        {/* 선택 금액 소계 */}
        {selectedIds.size > 0 && (
          <div className="bg-primary-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-primary-600 font-medium">내 예상 금액</span>
            <span className="font-bold text-primary-700">{totalPrice.toLocaleString()}원</span>
          </div>
        )}

        {/* 다른 팀원 선택 현황 */}
        {memberSelections.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">── 팀원 현황</p>
            <div className="space-y-2">
              {memberSelections.map(ms => (
                <MemberCard
                  key={ms.user.id}
                  name={ms.user.name}
                  team={ms.user.team}
                  isMe={ms.user.id === user?.id}
                  selectedMenus={ms.menus.map((m: Menu) => m.name)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomButton
        label={`메뉴 선택 완료! (${selectedIds.size}개 · ${totalPrice > 0 ? totalPrice.toLocaleString() + '원' : ''})`}
        onClick={handleConfirm}
        disabled={selectedIds.size === 0}
        isLoading={isLoading}
        loadingLabel="저장 중..."
      />
    </div>
  )
}
