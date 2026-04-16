'use client'

// ============================================================
// contexts/UserContext.tsx
// 현재 로그인한 사용자 정보를 앱 전체에서 공유하는 Context
// deviceId는 localStorage에 저장해서 앱을 껐다 켜도 유지됨
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@/types/api'

interface UserContextType {
  user: User | null
  deviceId: string | null
  setUser: (user: User) => void
  isLoading: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  deviceId: null,
  setUser: () => {},
  isLoading: true,
})

// deviceId 생성 (앱 최초 실행 시 랜덤 생성 후 localStorage에 저장)
function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('babpbang_device_id')
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem('babpbang_device_id', id)
  }
  return id
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const id = getOrCreateDeviceId()
    setDeviceId(id)

    // 저장된 사용자 정보 불러오기
    const savedUser = localStorage.getItem('babpbang_user')
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser))
      } catch {}
    }
    setIsLoading(false)
  }, [])

  const setUser = (user: User) => {
    setUserState(user)
    localStorage.setItem('babpbang_user', JSON.stringify(user))
  }

  return (
    <UserContext.Provider value={{ user, deviceId, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

// 사용법: const { user, deviceId } = useUser()
export const useUser = () => useContext(UserContext)
