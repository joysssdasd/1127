import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ 已配置' : '❌ 未配置',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已配置' : '❌ 未配置',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ 已配置' : '❌ 未配置',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '✅ 已配置' : '❌ 未配置',
    };

    // 检查 Supabase URL 是否是默认占位符
    const isSupabaseDefault = process.env.SUPABASE_URL === 'your_supabase_project_url';

    let databaseStatus = '❌ 数据库配置问题';
    let recommendation = '';

    if (isSupabaseDefault) {
      databaseStatus = '❌ 使用默认配置';
      recommendation = '请在 .env 文件中配置正确的 Supabase 项目信息';
    } else if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      databaseStatus = '✅ 基本配置完整';
      recommendation = '数据库配置看起来正确，如果仍有问题请检查网络连接';
    } else {
      databaseStatus = '❌ 配置不完整';
      recommendation = '请配置 SUPABASE_URL 和 SUPABASE_ANON_KEY';
    }

    res.status(200).json({
      status: 'success',
      environment: process.env.NODE_ENV || 'development',
      database_status: databaseStatus,
      recommendation,
      env_vars: envVars,
      next_steps: [
        '1. 确保已创建 Supabase 项目',
        '2. 复制项目的 URL 和匿名密钥',
        '3. 更新 .env 文件中的配置',
        '4. 重启开发服务器',
        '5. 测试数据库连接'
      ],
      env_file_example: `
# .env 文件示例
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
      `
    });
  } catch (error) {
    console.error('Env check error:', error);
    res.status(500).json({
      error: '检查环境变量时发生错误',
      message: (error as Error).message
    });
  }
}