/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.kakaocdn.net' },
      { protocol: 'https', hostname: 'map.pstatic.net' },
    ],
  },
}

module.exports = nextConfig
