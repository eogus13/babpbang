'use client'

// ============================================================
// app/onboarding/page.tsx
// 앱 최초 실행 시 이름 + 소속팀 입력 화면
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { registerUser } from '@/lib/api'

const TEAMS = ['조명팀', '카메라팀', '연출팀', '미술팀', '의상팀', '분장팀', '제작팀']

export default function OnboardingPage() {
  const router = useRouter()
  const { deviceId, setUser } = useUser()
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [customTeam, setCustomTeam] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedTeam = team === '직접입력' ? customTeam : team

  const handleSubmit = async () => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!selectedTeam.trim()) { setError('소속 팀을 선택하거나 입력해주세요.'); return }
    if (!deviceId) return

    setIsLoading(true)
    setError('')
    try {
      const user = await registerUser({ deviceId, name: name.trim(), team: selectedTeam.trim() })
      setUser(user)
      router.replace('/')
    } catch (e) {
      setError('등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* 로고 */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🍚</div>
        <h1 className="text-3xl font-bold text-gray-900">밥빵</h1>
        <p className="mt-2 text-gray-500 text-sm">촬영장 밥시간 조율앱</p>
      </div>

      {/* 이름 입력 */}
      <div className="w-full mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">이름이 뭐예요?</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
        />
      </div>

      {/* 팀 선택 */}
      <div className="w-full mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">소속 팀은요?</label>
        <div className="grid grid-cols-3 gap-2">
          {TEAMS.map(t => (
            <button
              key={t}
              onClick={() => setTeam(t)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                team === t
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setTeam('직접입력')}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              team === '직접입력'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            }`}
          >
            직접입력
          </button>
        </div>
        {team === '직접입력' && (
          <input
            type="text"
            value={customTeam}
            onChange={e => setCustomTeam(e.target.value)}
            placeholder="팀 이름 입력"
            className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
            autoFocus
          />
        )}
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* 시작 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-4 bg-primary-500 text-white font-bold text-lg rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
      >
        {isLoading ? '등록 중...' : '시작하기! 🍽️'}
      </button>
    </div>
  )
}
