// ============================================================
// types/api.ts
// 밥빵 앱 전체에서 사용하는 공통 타입 정의
// ============================================================

// ─── 공통 API 응답 형식 ───────────────────────────────────
export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ─── ENUM ─────────────────────────────────────────────────
export type SelectionMode = 'VOTE' | 'LEADER'

export type RoomStatus =
  | 'WAITING_ATTENDANCE'     // 참여 여부 투표 대기 중
  | 'SELECTING_RESTAURANT'   // 식당 선정 중
  | 'RESTAURANT_CONFIRMED'   // 식당 확정, 메뉴 선택 중
  | 'COMPLETED'              // 완료
  | 'CANCELLED'              // 취소

export type AttendanceStatus = 'PENDING' | 'JOIN' | 'SKIP'

// ─── 사용자 ───────────────────────────────────────────────
export interface User {
  id: string
  deviceId: string
  name: string
  team: string
  createdAt: string
}

// ─── 식당 ─────────────────────────────────────────────────
export interface Restaurant {
  id: string
  name: string
  category: string
  address: string
  lat: number
  lng: number
  phone?: string
  imageUrl?: string
  businessHours?: string
  rating: number
  reviewCount: number
  distanceMinutes?: number   // 현재 위치에서 도보 몇 분 (조회 시 계산)
  menus?: Menu[]
}

export interface Menu {
  id: string
  restaurantId: string
  name: string
  price: number
  menuCategory?: string
  description?: string
  imageUrl?: string
  isAvailable: boolean
}

// ─── 밥약속 방 ────────────────────────────────────────────
export interface Room {
  id: string
  code: string
  leaderId: string
  leader: User
  mealTime: string
  selectionMode: SelectionMode
  status: RoomStatus
  maxWalkMinutes: number
  lat?: number
  lng?: number
  confirmedRestaurant?: Restaurant
  members?: RoomMember[]
  createdAt: string
}

export interface RoomMember {
  id: string
  roomId: string
  userId: string
  user: User
  attendance: AttendanceStatus
  joinedAt?: string
}

// ─── 투표 ─────────────────────────────────────────────────
export interface RestaurantVote {
  userId: string
  user: User
  restaurantId: string
  restaurant: Pick<Restaurant, 'id' | 'name' | 'imageUrl'>
}

export interface VoteSummary {
  restaurantId: string
  restaurant: Pick<Restaurant, 'id' | 'name' | 'imageUrl' | 'category'>
  voteCount: number
  voters: Pick<User, 'id' | 'name'>[]
  myVote: boolean   // 내가 이 식당에 투표했는지
}

// ─── 메뉴 선택 ────────────────────────────────────────────
export interface MenuSelection {
  userId: string
  user: User
  menuId: string
  menu: Menu
}

export interface MemberMenuSummary {
  user: User
  menus: Menu[]
  totalPrice: number
}

// ─── 요청 Body 타입 ───────────────────────────────────────

export interface RegisterUserBody {
  deviceId: string
  name: string
  team: string
}

export interface CreateRoomBody {
  leaderId: string
  mealTime: string                 // ISO 8601
  selectionMode: SelectionMode
  maxWalkMinutes?: number          // 기본값 10
  lat?: number
  lng?: number
}

export interface AttendanceBody {
  userId: string
  attendance: 'JOIN' | 'SKIP'
}

export interface RestaurantVoteBody {
  userId: string
  restaurantId: string
}

export interface ConfirmRestaurantBody {
  leaderId: string
  restaurantId: string
}

export interface MenuSelectionBody {
  userId: string
  menuIds: string[]    // 여러 메뉴 동시에 선택 가능
}

// ─── 최종 요약 ────────────────────────────────────────────
export interface RoomSummary {
  room: Room
  restaurant: Restaurant
  memberMenus: MemberMenuSummary[]
  totalParticipants: number
  totalEstimatedPrice: number
}
