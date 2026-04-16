// ============================================================
// lib/utils.ts — 앱 전체에서 쓰는 공통 유틸리티 함수
// ============================================================

// ─── 날짜/시간 ────────────────────────────────────────────

/** "오늘 점심 12:30" 형식으로 포맷 */
export function formatMealTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString()
  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const hour = d.getHours()
  const meal = hour < 10 ? '아침' : hour < 15 ? '점심' : '저녁'

  if (isToday) return `오늘 ${meal} ${time}`
  if (isTomorrow) return `내일 ${meal} ${time}`
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}

// ─── 위치/거리 ────────────────────────────────────────────

/** 두 좌표 사이 거리(km) 계산 (Haversine) */
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** km → 도보 분 (평균 4km/h 기준) */
export function kmToWalkMinutes(km: number): number {
  return Math.round(km * 15)
}

// ─── 초대 코드 ────────────────────────────────────────────

/** 초대 코드 생성 (예: A3F-92X) */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = () => chars[Math.floor(Math.random() * chars.length)]
  return `${rand()}${rand()}${rand()}-${rand()}${rand()}${rand()}`
}

// ─── 숫자 포맷 ────────────────────────────────────────────

/** 1000 → "1,000원" */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`
}

/** 1000 → "1천원", 10000 → "1만원" */
export function formatPriceShort(price: number): string {
  if (price >= 10000) return `${(price / 10000).toFixed(price % 10000 === 0 ? 0 : 1)}만원`
  if (price >= 1000) return `${(price / 1000).toFixed(0)}천원`
  return `${price}원`
}

// ─── 문자열 ───────────────────────────────────────────────

/** 클립보드에 텍스트 복사 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** 카카오톡 공유용 텍스트 생성 */
export function buildShareText(params: {
  leaderName: string
  mealTime: string
  restaurantName?: string
  joinCode: string
  appUrl: string
}): string {
  const lines = [
    `🍚 밥빵 — ${params.leaderName}님이 초대했어요!`,
    `📅 ${formatMealTime(params.mealTime)}`,
  ]
  if (params.restaurantName) lines.push(`📍 ${params.restaurantName}`)
  lines.push(``, `👉 ${params.appUrl}/join/${params.joinCode}`)
  return lines.join('\n')
}
