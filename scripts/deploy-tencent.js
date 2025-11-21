#!/usr/bin/env node

// 腾讯云部署脚本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始腾讯云部署...\n');

// 检查必要文件
const requiredFiles = [
  'package.json',
  'next.config.js',
  '.env.production.example'
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ 缺少必要文件: ${file}`);
    process.exit(1);
  }
});

// 1. 构建项目
console.log('📦 构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建成功\n');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 2. 检查环境变量
const envFile = '.env.production';
if (!fs.existsSync(envFile)) {
  console.log('📝 创建环境变量文件...');
  fs.copyFileSync('.env.production.example', envFile);
  console.log(`⚠️  请编辑 ${envFile} 文件，填入正确的配置信息\n`);
  console.log('📝 环境变量文件创建完成，请配置后重新运行部署');
  process.exit(0);
}

// 3. 部署到腾讯云 Serverless
console.log('🌐 部署到腾讯云 Serverless...');
try {
  // 检查是否安装了腾讯云 CLI
  execSync('tcloud --version', { stdio: 'pipe' });
} catch (error) {
  console.log('📥 安装腾讯云 CLI...');
  execSync('npm install -g @cloudbase/cli', { stdio: 'inherit' });
}

try {
  // 登录腾讯云（如果未登录）
  execSync('tcloud login', { stdio: 'inherit' });

  // 部署函数
  execSync('tcloud functions:deploy', { stdio: 'inherit' });

  console.log('✅ 腾讯云部署成功\n');
} catch (error) {
  console.error('❌ 腾讯云部署失败:', error.message);
  console.log('\n🔧 手动部署步骤:');
  console.log('1. 登录腾讯云控制台');
  console.log('2. 创建 Serverless 应用');
  console.log('3. 上传构建产物');
  console.log('4. 配置环境变量');
  console.log('5. 配置域名');
  process.exit(1);
}

// 4. 配置域名（可选）
console.log('🌐 域名配置建议:');
console.log('1. 购买国内域名（阿里云/腾讯云）');
console.log('2. 完成域名备案');
console.log('3. 在腾讯云控制台配置自定义域名');
console.log('4. 配置 SSL 证书');
console.log('\n✅ 部署流程完成！');

// 5. 性能优化建议
console.log('\n⚡ 性能优化建议:');
console.log('1. 启用 CDN 加速');
console.log('2. 配置图片压缩');
console.log('3. 启用 Gzip 压缩');
console.log('4. 配置缓存策略');