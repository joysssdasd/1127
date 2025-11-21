import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 检查基本环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_URL: supabaseUrl ? 'configured' : 'missing',
        SUPABASE_KEY: supabaseKey ? 'configured' : 'missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
      }
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
}