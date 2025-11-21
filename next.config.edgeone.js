// Next.js 配置 - EdgeOne 部署
/** @type {import('next').NextConfig} */
const isEdgeOne = process.env.EDGEONE_DEPLOY === 'true';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // EdgeOne 特定配置
  ...(isEdgeOne ? {
    // 静态导出配置
    output: 'export',
    trailingSlash: true,

    // 图片优化配置（EdgeOne 静态托管不支持 Next.js 图片优化）
    images: {
      unoptimized: true,
      domains: [
        'cdn.your-domain.com',
        'your-domain.com'
      ]
    },

    // 资源前缀
    assetPrefix: process.env.EDGEONE_DOMAIN || '',

    // 基础路径
    basePath: process.env.EDGEONE_BASE_PATH || '',
  } : {
    // 原有配置用于 Vercel 部署
    experimental: {
      optimizePackageImports: ['@supabase/supabase-js']
    },
    images: {
      domains: [
        'cdn.your-domain.com',
        'your-domain.com'
      ],
      formats: ['image/webp', 'image/avif'],
      minimumCacheTTL: 60 * 60 * 24 * 30,
    },
    assetPrefix: process.env.CDN_DOMAIN,
  }),

  // 通用配置
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // 环境变量
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: isEdgeOne ? 'edgeone' : 'vercel',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // 重定向规则
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // EdgeOne 特定重定向
      ...(isEdgeOne ? [
        {
          source: '/api/:path*',
          destination: `${process.env.API_ENDPOINT || 'https://api.your-domain.com'}/api/:path*`,
          permanent: false,
        }
      ] : [])
    ];
  },

  // 重写规则（用于 API 代理）
  async rewrites() {
    return [
      // EdgeOne 部署时的 API 代理
      ...(isEdgeOne && process.env.API_ENDPOINT ? [
        {
          source: '/api/:path*',
          destination: `${process.env.API_ENDPOINT}/api/:path*`,
        }
      ] : [])
    ];
  },

  // 头部配置
  async headers() {
    const headers = [
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

    // EdgeOne 特定头部
    if (isEdgeOne) {
      headers.push(
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Deployed-By',
              value: 'EdgeOne',
            },
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization',
            }
          ],
        }
      );
    }

    return headers;
  },

  // Webpack 配置
  webpack: (config, { isServer }) => {
    if (isEdgeOne) {
      // EdgeOne 特定的 Webpack 配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;