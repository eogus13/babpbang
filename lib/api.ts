// ============================================================
// lib/api.ts — 클라이언트 API 호출 함수 모음 (완성본)
// ============================================================

import type {
  User, Room, Restaurant, VoteSummary, RoomSummary,
  RegisterUserBody, CreateRoomBody,
} from '@/types/api'

// ─── 공통 fetch 래퍼 ─────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '요청에 실패했습니다.')
  return json.data as T
}

// ─── 사용자 ───────────────────────────────────────────────

export async function registerUser(body: RegisterUserBody): Promise<User> {
  return apiFetch('/api/users', { method: 'POST', body: JSON.stringify(body) })
}

export async function getMe(deviceId: string): Promise<User> {
  return apiFetch(`/api/users?deviceId=${deviceId}`)
}

// ─── 밥약속 방 ────────────────────────────────────────────

export async function createRoom(body: CreateRoomBody): Promise<Room> {
  return apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(body) })
}

/** 초대 코드로 방 조회 (join 페이지) */
export async function getRoomByCode(code: string): Promise<Room> {
  return apiFetch(`/api/rooms?code=${code}`)
}

/** 방 ID로 방 조회 (페이지 폴링) */
export async function getRoomById(id: string): Promise<Room> {
  return apiFetch(`/api/rooms/${id}`)
}

/** 유저가 참여 중인 방 목록 (홈 화면) */
export async function getRoomsByUser(userId: string): Promise<Room[]> {
  return apiFetch(`/api/rooms?userId=${userId}`)
}

// ─── 참여 여부 ────────────────────────────────────────────

export async function joinRoom(roomId: string, userId: string) {
  return apiFetch(`/api/rooms/${roomId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export async function respondAttendance(
  roomId: string, userId: string, attendance: 'JOIN' | 'SKIP'
) {
  return apiFetch(`/api/rooms/${roomId}/attendance`, {
    method: 'PATCH',
    body: JSON.stringify({ userId, attendance }),
  })
}

// ─── 식당 추천 ────────────────────────────────────────────

export async function getNearbyRestaurants(params: {
  lat: number; lng: number; maxMinutes?: number; category?: string
}): Promise<{ restaurants: Restaurant[]; total: number }> {
  const q = new URLSearchParams({
    lat: String(params.lat), lng: String(params.lng),
    ...(params.maxMinutes ? { maxMinutes: String(params.maxMinutes) } : {}),
    ...(params.category ? { category: params.category } : {}),
  })
  return apiFetch(`/api/restaurants/nearby?${q}`)
}

/** 식당 상세 (메뉴 포함) */
export async function getRestaurantById(id: string): Promise<Restaurant> {
  return apiFetch(`/api/restaurants/${id}`)
}

// ─── 식당 투표 ────────────────────────────────────────────

export async function getRestaurantVotes(roomId: string): Promise<{
  summary: VoteSummary[]; totalVotes: number
}> {
  return apiFetch(`/api/rooms/${roomId}/restaurant-vote`)
}

export async function voteRestaurant(roomId: string, userId: string, restaurantId: string) {
  return apiFetch(`/api/rooms/${roomId}/restaurant-vote`, {
    method: 'POST',
    body: JSON.stringify({ userId, restaurantId }),
  })
}

export async function cancelVote(roomId: string, userId: string) {
  return apiFetch(`/api/rooms/${roomId}/restaurant-vote?userId=${userId}`, { method: 'DELETE' })
}

// ─── 식당 확정 ────────────────────────────────────────────

export async function confirmRestaurant(
  roomId: string, leaderId: string, restaurantId: string
): Promise<Room> {
  return apiFetch(`/api/rooms/${roomId}/confirm-restaurant`, {
    method: 'POST',
    body: JSON.stringify({ leaderId, restaurantId }),
  })
}

// ─── 메뉴 선택 ────────────────────────────────────────────

export async function getMenuSelections(roomId: string) {
  return apiFetch(`/api/rooms/${roomId}/menu-selection`)
}

export async function selectMenus(roomId: string, userId: string, menuIds: string[]) {
  return apiFetch(`/api/rooms/${roomId}/menu-selection`, {
    method: 'POST',
    body: JSON.stringify({ userId, menuIds }),
  })
}

// ─── 최종 요약 ────────────────────────────────────────────

export async function getRoomSummary(roomId: string): Promise<RoomSummary> {
  return apiFetch(`/api/rooms/${roomId}/summary`)
}
