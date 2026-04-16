// ============================================================
// app/api/restaurants/nearby/route.ts
// 근처 식당 목록 조회 (위치 기반)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 두 좌표 간 거리 계산 (Haversine 공식, 단위: km)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

// 도보 속도 기준: 1km = 약 12분
function kmToWalkMinutes(km: number): number {
  return Math.round(km * 12)
}

// GET /api/restaurants/nearby?lat=37.5&lng=127.0&maxMinutes=10&category=한식
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const lat = parseFloat(params.get('lat') || '')
    const lng = parseFloat(params.get('lng') || '')
    const maxMinutes = parseInt(params.get('maxMinutes') || '10')
    const category = params.get('category')

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: '위치 정보(lat, lng)가 필요합니다.' },
        { status: 400 }
      )
    }

    // DB에서 활성 식당 전체 조회 후 거리 필터링
    // 실제 서비스에선 PostGIS 같은 공간 쿼리를 쓰는 게 더 효율적
    const allRestaurants = await db.restaurant.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      include: {
        menus: { where: { isAvailable: true }, take: 5 }
      }
    })

    const maxKm = (maxMinutes / 12)

    const nearby = allRestaurants
      .map(restaurant => {
        const distanceKm = getDistanceKm(lat, lng, restaurant.lat, restaurant.lng)
        const distanceMinutes = kmToWalkMinutes(distanceKm)
        return { ...restaurant, distanceKm, distanceMinutes }
      })
      .filter(r => r.distanceKm <= maxKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)

    return NextResponse.json({
      success: true,
      data: {
        restaurants: nearby,
        total: nearby.length,
        baseLat: lat,
        baseLng: lng,
        maxWalkMinutes: maxMinutes,
      }
    })
  } catch (error) {
    console.error('[GET /api/restaurants/nearby]', error)
    return NextResponse.json(
      { success: false, error: '근처 식당을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
