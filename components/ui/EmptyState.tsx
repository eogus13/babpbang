// ============================================================
// components/ui/EmptyState.tsx
// 빈 상태 화면 — 데이터가 없을 때 표시
// ============================================================

interface EmptyStateProps {
  emoji?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({
  emoji = '🍽️',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <p className="font-semibold text-gray-700">{title}</p>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * 사용 예시:
 *
 * <EmptyState
 *   emoji="😢"
 *   title="근처에 식당이 없어요"
 *   description="이동 거리를 늘려보세요"
 * />
 *
 * <EmptyState
 *   emoji="🍽️"
 *   title="진행 중인 밥약속이 없어요"
 *   action={{ label: '+ 새 밥약속 만들기', onClick: () => router.push('/room/new') }}
 * />
 */
