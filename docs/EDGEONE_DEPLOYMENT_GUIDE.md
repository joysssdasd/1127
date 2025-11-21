# 腾讯 EdgeOne 部署指南

## EdgeOne 平台介绍

### 核心优势
- **全球边缘节点**: 2800+ 边缘节点，覆盖中国主要城市
- **毫秒级响应**: 边缘计算，减少网络延迟
- **一体化服务**: CDN + 边缘计算 + 安全防护
- **中国优化**: 专门针对中国大陆网络环境优化
- **成本效益**: 比传统 CDN 性能更好，价格更优

### 与 Vercel 对比
| 特性 | Vercel | EdgeOne |
|------|--------|---------|
| 中国大陆访问 | ❌ 需要VPN | ✅ 直接访问 |
| 边缘节点 | 海外为主 | ✅ 中国主要城市 |
| 响应时间 | 100-500ms | 10-50ms |
| 价格 | $20-100/月 | ¥50-300/月 |
| 域名备案 | 不需要 | ✅ 需要 |
| API 支持 | ✅ 完整 | ✅ 支持 |

## 部署方式选择

### 方式一：静态站点部署（推荐）
- **适用场景**: 主要为展示类页面，API 使用其他云服务
- **优势**: 部署简单，成本低，性能好
- **限制**: 无法直接运行 Next.js API 路由

### 方式二：边缘函数部署
- **适用场景**: 需要运行 API 函数
- **优势**: 支持边缘计算，API 直接在中国运行
- **复杂度**: 需要调整代码结构

## 静态站点部署方案

### 1. 构建静态版本
```bash
# 构建静态导出版本
npm run build
npm run export
```

### 2. EdgeOne 配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // EdgeOne 静态托管不支持图片优化
  },
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://your-domain.edgeone.com'
    : undefined,
};

module.exports = nextConfig;
```

### 3. 环境变量配置
```bash
# .env.production
NODE_ENV=production
EDGEONE_DOMAIN=your-domain.edgeone.com
CDN_PREFIX=https://your-domain.edgeone.com
```

## 边缘函数部署方案

### 1. 项目结构调整
```
├── edge-functions/
│   ├── api/
│   │   ├── listings.ts
│   │   ├── auth/
│   │   └── health.ts
│   └── utils/
├── public/
└── package.json
```

### 2. EdgeOne 函数配置
```javascript
// edgeone.config.js
module.exports = {
  functions: {
    directory: 'edge-functions',
    routes: [
      {
        src: '/api/(.*)',
        dest: '/api/$1'
      }
    ]
  },
  static: {
    directory: 'out',
    routes: [
      {
        src: '/(.*)',
        dest: '/$1'
      }
    ]
  }
};
```

### 3. API 函数适配
```typescript
// edge-functions/api/listings.ts
import { EdgeFunction } from '@edgeone-runtime/node';

export const config: EdgeFunction = {
  runtime: 'nodejs',
  regions: ['ap-guangzhou', 'ap-beijing'],
  memory: 256,
  timeout: 30,
};

export default async function handler(req: Request) {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    // 处理 listings 请求
    const data = await getListings();
    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
```

## 部署步骤

### 第一步：注册 EdgeOne
1. 访问 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 注册腾讯云账号
3. 开通 EdgeOne 服务

### 第二步：创建站点
```bash
# 使用 EdgeOne CLI
npm install -g @tencent-cloud/edgeone-cli

# 登录
edgeone login

# 创建站点
edgeone site create \
  --name c2c-marketplace \
  --region ap-guangzhou \
  --domains your-domain.com
```

### 第三步：域名配置
1. 购买国内域名
2. 完成域名备案
3. 在 EdgeOne 控制台添加域名
4. 配置 DNS 解析

### 第四步：部署静态资源
```bash
# 构建项目
npm run build

# 部署到 EdgeOne
edgeone deploy --site c2c-marketplace --directory out
```

### 第五步：配置边缘函数
```bash
# 部署边缘函数
edgeone functions deploy \
  --site c2c-marketplace \
  --directory edge-functions
```

## 性能优化配置

### 1. 缓存策略
```javascript
// edgeone.config.js
module.exports = {
  static: {
    directory: 'out',
    cache: {
      // 静态资源缓存 1年
      '/_next/static/*': {
        maxAge: 31536000,
        immutable: true
      },
      // 图片缓存 30天
      '/images/*': {
        maxAge: 2592000
      },
      // 页面缓存 1小时
      '/*.html': {
        maxAge: 3600
      }
    }
  }
};
```

### 2. 压缩配置
```javascript
// next.config.js
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // 启用 Gzip 压缩
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

### 3. 图片优化
```javascript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      unoptimized // EdgeOne 静态托管不支持 Next.js 图片优化
      priority={props.priority}
    />
  );
}
```

## 环境变量管理

### 开发环境
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=postgresql://localhost:5432/c2c_dev
```

### 生产环境
```bash
# 在 EdgeOne 控制台配置
API_ENDPOINT=https://api.your-domain.com
DATABASE_URL=postgresql://user:pass@host:5432/c2c_prod
JWT_SECRET=your-production-secret
```

### 代码中使用
```typescript
// lib/env.ts
export const config = {
  api: process.env.NEXT_PUBLIC_API_URL || '/api',
  db: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
};
```

## 监控和分析

### 1. 访问统计
- 登录 EdgeOne 控制台
- 查看访问量、带宽使用
- 监控错误率和响应时间

### 2. 性能监控
```javascript
// 添加性能监控
export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
    });
  }
}
```

### 3. 错误监控
```typescript
// lib/errorTracking.ts
export function trackError(error: Error, context: string) {
  console.error(`[${context}] Error:`, error);
  // 可以集成 Sentry 或其他错误监控服务
}
```

## 成本估算

### EdgeOne 费用
- **静态托管**: 免费
- **带宽费用**: ¥0.21-0.35/GB
- **请求费用**: ¥0.01/万次
- **边缘函数**: ¥0.0002/万次调用

### 月成本预估
- **小流量** (<100GB): ¥21-35
- **中流量** (100-500GB): ¥50-150
- **大流量** (>500GB): ¥100-300

### 域名和备案
- **域名注册**: ¥60-100/年
- **备案服务**: ¥0-200（可选择代办）

## 故障排除

### 常见问题
1. **页面 404**: 检查路由配置和文件路径
2. **静态资源 404**: 检查 assetPrefix 配置
3. **API 调用失败**: 检查 CORS 配置
4. **域名解析问题**: 检查 DNS 配置

### 应急方案
1. **降级到静态托管**: 暂时关闭边缘函数
2. **备用域名**: 配置多个域名
3. **回滚到 Vercel**: 保持原有部署作为备份

## 迁移策略

### 渐进式迁移
1. **第一步**: 部署静态资源到 EdgeOne
2. **第二步**: API 保持 Vercel
3. **第三步**: 逐步迁移 API 到边缘函数
4. **第四步**: 切换 DNS 完全迁移

### 风险控制
- 保持原部署在线
- A/B 测试验证性能
- 监控错误率和用户体验
- 准备快速回滚方案