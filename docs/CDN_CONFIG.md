# CDN 配置指南

## 又拍云 CDN 配置

### 1. 注册又拍云
- 访问 [又拍云官网](https://www.upyun.com/)
- 注册账号并完成实名认证

### 2. 创建 CDN 服务
```
服务名称: c2c-marketplace
加速域名: your-domain.com
源站地址: your-vercel-app.vercel.app
```

### 3. 配置缓存规则
```
# 静态资源缓存
/_next/static/* - 缓存时间: 1年
/static/* - 缓存时间: 30天
/images/* - 缓存时间: 7天

# API 不缓存
/api/* - 缓存时间: 不缓存
```

### 4. 配置 HTTPS
- 上传 SSL 证书
- 强制 HTTPS 跳转

## 七牛云 CDN 配置

### 1. 注册七牛云
- 访问 [七牛云官网](https://www.qiniu.com/)
- 注册账号并实名认证

### 2. 创建 CDN 加速
```
域名: your-domain.com
业务类型: 网页加速
源站地址: your-vercel-app.vercel.app
```

### 3. 配置缓存策略
```
缓存规则:
- 文件后缀 .js .css .png .jpg - 30天
- 文件目录 /_next/static/ - 1年
- API 路径 /api/ - 不缓存
```

## 腾讯云 CDN 配置

### 1. 登录腾讯云控制台
- 进入 CDN 产品页面
- 点击"添加域名"

### 2. 配置加速域名
```
加速域名: your-domain.com
加速区域: 中国大陆
源站类型: 域名
源站地址: your-vercel-app.vercel.app
```

### 3. 缓存配置
```
缓存键规则配置:
- 全路径缓存
- 忽略查询参数

缓存过期配置:
- 文件类型 .js/.css: 30天
- 文件类型 .jpg/.png/.gif: 7天
- 文件类型 .html/.htm: 1小时
```

## DNS 配置

### 又拍云 DNS 示例
```
A记录: @ -> 又派云提供的IP地址
CNAME: www -> 又派云提供的域名
```

### 七牛云 DNS 示例
```
CNAME: @ -> 七牛云提供的域名
CNAME: www -> 七牛云提供的域名
```

### 腾讯云 DNS 示例
```
CNAME: @ -> 腾讯云CDN域名
CNAME: www -> 腾讯云CDN域名
```

## 测试验证

### 1. 访问测试
```bash
# 测试访问速度
curl -w "@curl-format.txt" https://your-domain.com

# 测试缓存生效
curl -I https://your-domain.com/_next/static/chunks/main.js
```

### 2. 性能测试
- 使用 [PageSpeed Insights](https://pagespeed.web.dev/)
- 使用 [GTmetrix](https://gtmetrix.com/)
- 使用 [WebPageTest](https://www.webpagetest.org/)

## 监控告警

### 1. 访问监控
- 设置访问量告警
- 监控响应时间
- 错误率监控

### 2. 带宽监控
- 带宽使用率监控
- 流量统计
- 成本控制

## 成本估算

### 又拍云
- 流量费用: ¥0.18/GB
- 请求费用: ¥0.01/万次
- 月预估: ¥20-100

### 七牛云
- 流量费用: ¥0.18-0.29/GB
- 请求费用: ¥0.01/万次
- 月预估: ¥20-150

### 腾讯云
- 流量费用: ¥0.21/GB
- 请求费用: ¥0.01/万次
- 月预估: ¥25-120

## 故障处理

### 常见问题
1. **源站连接失败** - 检查源站地址配置
2. **缓存不更新** - 手动刷新缓存
3. **HTTPS 证书问题** - 重新上传证书
4. **解析不生效** - 检查 DNS 配置

### 应急方案
- 临时关闭 CDN
- 切换源站地址
- 联系技术支持