#!/usr/bin/env node

/**
 * 腾讯 EdgeOne 部署脚本
 * 使用方法: node scripts/deploy-edgeone.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署到腾讯 EdgeOne...\n');

// 配置项
const config = {
  siteName: process.env.EDGEONE_SITE_NAME || 'c2c-marketplace',
  region: process.env.EDGEONE_REGION || 'ap-guangzhou',
  domain: process.env.EDGEONE_DOMAIN || '',
  apiEndpoint: process.env.API_ENDPOINT || '',
  outputDir: 'out',
  functionsDir: 'edge-functions'
};

// 检查必要文件
const requiredFiles = [
  'package.json',
  'next.config.edgeone.js',
  'docs/EDGEONE_DEPLOYMENT_GUIDE.md'
];

console.log('📋 检查必要文件...');
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ 缺少必要文件: ${file}`);
    process.exit(1);
  }
});

console.log('✅ 必要文件检查通过\n');

// 1. 设置环境变量
console.log('🔧 设置 EdgeOne 部署环境...');
process.env.EDGEONE_DEPLOY = 'true';
process.env.NODE_ENV = 'production';
process.env.NEXT_CONFIG_FILE = 'next.config.edgeone.js';

// 2. 创建环境变量文件
const envContent = `
# EdgeOne 部署配置
EDGEONE_DEPLOY=true
NODE_ENV=production
EDGEONE_SITE_NAME=${config.siteName}
EDGEONE_REGION=${config.region}
EDGEONE_DOMAIN=${config.domain}
NEXT_PUBLIC_DEPLOY_TARGET=edgeone
NEXT_PUBLIC_API_URL=${config.apiEndpoint ? `${config.apiEndpoint}/api` : '/api'}
API_ENDPOINT=${config.apiEndpoint}
`;

if (!fs.existsSync('.env.edgeone')) {
  fs.writeFileSync('.env.edgeone', envContent.trim());
  console.log('✅ 创建 .env.edgeone 文件\n');
}

// 3. 构建项目
console.log('📦 构建静态版本...');
try {
  // 使用 EdgeOne 配置构建
  const buildCommand = `EDGEONE_DEPLOY=true NODE_ENV=production npx next build --config next.config.edgeone.js`;
  console.log(`执行: ${buildCommand}`);

  execSync(buildCommand, { stdio: 'inherit' });

  // 检查构建输出
  if (!fs.existsSync(config.outputDir)) {
    console.error('❌ 构建失败：找不到输出目录');
    process.exit(1);
  }

  console.log('✅ 构建成功\n');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 4. 创建 EdgeOne 配置文件
console.log('⚙️ 创建 EdgeOne 配置...');
const edgeOneConfig = {
  version: '1.0',
  site: {
    name: config.siteName,
    region: config.region,
    domains: config.domain ? [config.domain] : []
  },
  static: {
    directory: config.outputDir,
    cache: {
      '/_next/static/*': {
        maxAge: 31536000,
        immutable: true
      },
      '/images/*': {
        maxAge: 2592000
      },
      '/*.html': {
        maxAge: 3600
      },
      '/static/*': {
        maxAge: 86400
      }
    },
    compression: {
      enabled: true,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    }
  },
  functions: fs.existsSync(config.functionsDir) ? {
    directory: config.functionsDir,
    runtime: 'nodejs',
    regions: [config.region, 'ap-beijing', 'ap-shanghai'],
    memory: 256,
    timeout: 30
  } : undefined,
  routing: [
    {
      type: 'static',
      pattern: '/(.*)',
      destination: '/$1'
    },
    ...(config.apiEndpoint ? [{
      type: 'proxy',
      pattern: '/api/(.*)',
      destination: `${config.apiEndpoint}/api/$1`
    }] : [])
  ]
};

fs.writeFileSync(
  'edgeone.config.json',
  JSON.stringify(edgeOneConfig, null, 2)
);

console.log('✅ EdgeOne 配置文件创建完成\n');

// 5. 检查 EdgeOne CLI
console.log('🔍 检查 EdgeOne CLI...');
try {
  execSync('edgeone --version', { stdio: 'pipe' });
  console.log('✅ EdgeOne CLI 已安装\n');
} catch (error) {
  console.log('📥 安装 EdgeOne CLI...');
  try {
    execSync('npm install -g @tencent-cloud/edgeone-cli', { stdio: 'inherit' });
    console.log('✅ EdgeOne CLI 安装成功\n');
  } catch (installError) {
    console.error('❌ EdgeOne CLI 安装失败:', installError.message);
    console.log('\n请手动安装:');
    console.log('1. 访问 https://console.cloud.tencent.com/edgeone');
    console.log('2. 下载 EdgeOne CLI');
    console.log('3. 执行 edgeone login');
    process.exit(1);
  }
}

// 6. 部署到 EdgeOne
console.log('🌐 部署到 EdgeOne...');
try {
  // 登录检查
  console.log('检查登录状态...');
  execSync('edgeone whoami', { stdio: 'pipe' });
} catch (error) {
  console.log('⚠️ 未登录，需要执行: edgeone login');
  console.log('1. 访问腾讯云控制台获取 SecretId 和 SecretKey');
  console.log('2. 执行: edgeone login');
  process.exit(1);
}

try {
  // 部署静态资源
  console.log('部署静态资源...');
  execSync(`edgeone static deploy --site ${config.siteName} --directory ${config.outputDir}`, { stdio: 'inherit' });

  // 部署函数（如果存在）
  if (fs.existsSync(config.functionsDir)) {
    console.log('部署边缘函数...');
    execSync(`edgeone functions deploy --site ${config.siteName} --directory ${config.functionsDir}`, { stdio: 'inherit' });
  }

  console.log('✅ EdgeOne 部署成功!\n');
} catch (error) {
  console.error('❌ EdgeOne 部署失败:', error.message);
  console.log('\n手动部署步骤:');
  console.log('1. 登录 EdgeOne 控制台');
  console.log('2. 创建站点或选择现有站点');
  console.log('3. 上传 out 目录中的文件');
  console.log('4. 配置域名和路由规则');
  process.exit(1);
}

// 7. 部署后检查
console.log('🔍 部署后检查...');
if (config.domain) {
  console.log(`✅ 站点地址: https://${config.domain}`);
  console.log('📋 下一步操作:');
  console.log('1. 配置域名解析到 EdgeOne');
  console.log('2. 完成 ICP 备案');
  console.log('3. 配置 SSL 证书');
  console.log('4. 测试访问功能');
} else {
  console.log('⚠️ 未配置域名，请:');
  console.log('1. 在 EdgeOne 控制台添加域名');
  console.log('2. 配置 DNS 解析');
  console.log('3. 完成 ICP 备案');
}

console.log('\n🎉 EdgeOne 部署流程完成!');
console.log('\n📚 相关文档:');
console.log('- EdgeOne 部署指南: docs/EDGEONE_DEPLOYMENT_GUIDE.md');
console.log('- EdgeOne 控制台: https://console.cloud.tencent.com/edgeone');
console.log('- 技术支持: 95716');

// 8. 性能优化建议
console.log('\n⚡ 性能优化建议:');
console.log('1. 启用图片压缩和 WebP 格式');
console.log('2. 配置合适的缓存策略');
console.log('3. 使用中国区域的边缘函数');
console.log('4. 监控访问速度和错误率');

// 9. 成本监控
console.log('\n💰 成本监控:');
console.log('- 定期检查带宽使用量');
console.log('- 监控边缘函数调用次数');
console.log('- 设置费用告警阈值');