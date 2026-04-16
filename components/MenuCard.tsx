'use client'

// ============================================================
// components/MenuCard.tsx
// 메뉴 선택 카드 — 메뉴 선택 화면에서 각 메뉴 항목
// ============================================================

import type { Menu } from '@/types/api'

interface MenuCardProps {
  menu: Menu
  isSelected: boolean
  onToggle: (menuId: string) => void
}

export default function MenuCard({ menu, isSelected, onToggle }: MenuCardProps) {
  return (
    <button
      onClick={() => onToggle(menu.id)}
      className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* 메뉴 정보 */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-tight ${
            isSelected ? 'text-primary-700' : 'text-gray-800'
          }`}>
            {menu.name}
          </p>
          {menu.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{menu.description}</p>
          )}
        </div>

        {/* 가격 + 체크 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-bold ${
            isSelected ? 'text-primary-600' : 'text-gray-600'
          }`}>
            {menu.price.toLocaleString()}원
          </span>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
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
 * const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
 *
 * const toggle = (menuId: string) => {
 *   setSelectedIds(prev => {
 *     const next = new Set(prev)
 *     next.has(menuId) ? next.delete(menuId) : next.add(menuId)
 *     return next
 *   })
 * }
 *
 * <MenuCard
 *   menu={menu}
 *   isSelected={selectedIds.has(menu.id)}
 *   onToggle={toggle}
 * />
 */
