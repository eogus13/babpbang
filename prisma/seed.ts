// prisma/seed.ts
// 프로덕션 DB 초기 데이터 (식당 + 메뉴 샘플)
// npx ts-node prisma/seed.ts 또는 npx prisma db seed 로 실행

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 입력 시작...')

  // 식당 6개 + 메뉴 입력
  const restaurants = [
    {
      name: '황금참치',
      category: '일식',
      address: '서울 중구 을지로 100',
      lat: 37.5665, lng: 126.9780,
      phone: '02-1234-5678',
      businessHours: '11:00~22:00',
      rating: 4.5, reviewCount: 128,
      menus: [
        { name: '참치회 정식', price: 18000, menuCategory: '정식' },
        { name: '연어 덮밥', price: 13000, menuCategory: '덮밥' },
        { name: '광어회 정식', price: 20000, menuCategory: '정식' },
      ]
    },
    {
      name: '명동칼국수',
      category: '한식',
      address: '서울 중구 명동길 25',
      lat: 37.5640, lng: 126.9822,
      phone: '02-9876-5432',
      businessHours: '10:30~21:30',
      rating: 4.2, reviewCount: 256,
      menus: [
        { name: '바지락 칼국수', price: 9000, menuCategory: '면류' },
        { name: '해물 칼국수', price: 11000, menuCategory: '면류' },
        { name: '만두국', price: 8000, menuCategory: '국물' },
      ]
    },
    {
      name: '이태리키친',
      category: '양식',
      address: '서울 중구 퇴계로 50',
      lat: 37.5620, lng: 126.9753,
      phone: '02-5555-7777',
      businessHours: '11:30~22:00',
      rating: 4.0, reviewCount: 89,
      menus: [
        { name: '봉골레 파스타', price: 14000, menuCategory: '파스타' },
        { name: '까르보나라', price: 15000, menuCategory: '파스타' },
        { name: '마르게리타 피자', price: 17000, menuCategory: '피자' },
      ]
    },
    {
      name: '고려삼계탕',
      category: '한식',
      address: '서울 중구 남대문로 30',
      lat: 37.5638, lng: 126.9762,
      phone: '02-3333-4444',
      businessHours: '09:00~20:00',
      rating: 4.7, reviewCount: 412,
      menus: [
        { name: '삼계탕', price: 16000, menuCategory: '탕' },
        { name: '옻닭 삼계탕', price: 18000, menuCategory: '탕' },
      ]
    },
    {
      name: '홍콩반점',
      category: '중식',
      address: '서울 중구 세종대로 15',
      lat: 37.5658, lng: 126.9791,
      phone: '02-7777-8888',
      businessHours: '11:00~21:00',
      rating: 3.9, reviewCount: 67,
      menus: [
        { name: '짜장면', price: 7000, menuCategory: '면류' },
        { name: '짬뽕', price: 8000, menuCategory: '면류' },
        { name: '탕수육 (소)', price: 15000, menuCategory: '요리' },
      ]
    },
    {
      name: '버거플러스',
      category: '양식',
      address: '서울 중구 충무로 20',
      lat: 37.5632, lng: 126.9824,
      phone: '02-2222-1111',
      businessHours: '10:00~22:00',
      rating: 4.1, reviewCount: 143,
      menus: [
        { name: '클래식 버거 세트', price: 9900, menuCategory: '버거' },
        { name: '더블 치즈버거 세트', price: 12900, menuCategory: '버거' },
        { name: '치킨 버거 세트', price: 10900, menuCategory: '버거' },
      ]
    },
  ]

  for (const r of restaurants) {
    const { menus, ...restaurantData } = r
    const restaurant = await prisma.restaurant.upsert({
      where: { externalId: `seed_${r.name}` },
      update: {},
      create: {
        ...restaurantData,
        externalId: `seed_${r.name}`,
        menus: { create: menus },
      },
    })
    console.log(`  ✅ ${restaurant.name}`)
  }

  console.log('🎉 시드 완료!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
