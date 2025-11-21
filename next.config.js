// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 为中国网络优化
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },

  // 图片优化配置
  images: {
    domains: [
      // 允许的外部图片域名
      'cdn.your-domain.com',
      'your-domain.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天缓存
  },

  // 压缩配置
  compress: true,

  // 静态文件缓存
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向规则（可选）
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // 为国内CDN优化
  assetPrefix: process.env.NODE_ENV === 'production'
    ? process.env.CDN_DOMAIN
    : undefined,
};

module.exports = nextConfig;
