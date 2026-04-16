// ============================================================
// components/ui/LoadingSpinner.tsx
// 로딩 스피너 — 데이터 불러오는 중 표시
// ============================================================

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-14 h-14 border-4',
}

export default function LoadingSpinner({
  message = '불러오는 중...',
  size = 'md',
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className={`${SIZE[size]} border-primary-200 border-t-primary-500 rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  )
}
