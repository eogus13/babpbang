'use client'

// ============================================================
// components/ui/BottomButton.tsx
// 하단 고정 CTA 버튼 — 모든 화면 하단에 반복되는 패턴
// ============================================================

interface BottomButtonProps {
  label: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  isLoading?: boolean
  loadingLabel?: string
  variant?: 'primary' | 'secondary' | 'outline'
  subText?: string    // 버튼 아래 작은 안내 텍스트
}

const VARIANT_STYLES = {
  primary:   'bg-primary-500 text-white disabled:bg-primary-200',
  secondary: 'bg-gray-100 text-gray-700 disabled:opacity-40',
  outline:   'border-2 border-primary-500 text-primary-500 disabled:opacity-40',
}

export default function BottomButton({
  label,
  onClick,
  disabled = false,
  isLoading = false,
  loadingLabel,
  variant = 'primary',
  subText,
}: BottomButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-5 py-4 bg-white border-t border-gray-100 pb-safe">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`w-full py-4 font-bold text-lg rounded-2xl active:scale-95 transition-all ${VARIANT_STYLES[variant]}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {loadingLabel ?? '처리 중...'}
          </span>
        ) : label}
      </button>
      {subText && (
        <p className="text-center text-xs text-gray-400 mt-1.5">{subText}</p>
      )}
    </div>
  )
}

/**
 * 사용 예시:
 *
 * // 기본 (주 버튼)
 * <BottomButton label="메뉴 선택 완료!" onClick={handleConfirm} isLoading={loading} />
 *
 * // 비활성화 + 안내 텍스트
 * <BottomButton
 *   label="식당 찾기 시작 →"
 *   disabled={joinCount < 1}
 *   subText="1명 이상 참여해야 시작할 수 있어요"
 * />
 *
 * // 아웃라인 변형
 * <BottomButton label="💬 공유하기" variant="outline" onClick={handleShare} />
 */
