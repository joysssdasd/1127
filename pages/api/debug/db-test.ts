import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 开始数据库连接测试...');

    // 测试基本环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('📋 环境变量检查:');
    console.log('- SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置');
    console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ 已设置' : '❌ 未设置');

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({
        success: false,
        error: '环境变量未配置',
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          recommendation: '请在 .env 文件中配置 Supabase URL 和密钥'
        }
      });
    }

    // 尝试导入并测试数据库连接
    try {
      // 测试 controllers 导入
      const { controllers } = await import('../../../lib/server/controllers');
      console.log('✅ Controllers 导入成功');

      // 测试 listing.list() 方法
      console.log('📝 测试数据列表获取...');
      const data = await controllers.listing.list();
      console.log('✅ 数据库连接成功');
      console.log(`📊 获取到 ${data.length} 条记录`);

      return res.status(200).json({
        success: true,
        message: '数据库连接测试成功',
        data: {
          recordCount: data.length,
          connectionStatus: '✅ 正常',
          sampleData: data.slice(0, 2) // 返回前2条记录作为示例
        }
      });

    } catch (dbError) {
      console.error('❌ 数据库连接失败:', dbError);
      return res.status(500).json({
        success: false,
        error: '数据库连接失败',
        details: {
          message: (dbError as Error).message,
          stack: process.env.NODE_ENV === 'development' ? (dbError as Error).stack : undefined
        },
        recommendation: '请检查 Supabase 配置和网络连接'
      });
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return res.status(500).json({
      success: false,
      error: '测试失败',
      message: (error as Error).message
    });
  }
}