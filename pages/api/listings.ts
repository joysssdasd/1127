import type { NextApiRequest, NextApiResponse } from 'next';
import type { ListingPayload } from '../../backend/shared/contracts/listing';
import { controllers } from '../../lib/server/controllers';
import { requireAuth } from '../../lib/server/auth';
import { handleDatabaseError, DatabaseError } from '../../lib/server/errorHandler';

type ListingsResponse = {
  data?: ListingPayload | ListingPayload[];
  error?: string;
  warning?: string;
  message?: string;
};

async function handleGet(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  try {
    // 提取搜索参数
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.toLowerCase() : undefined;
    const tradeTypes = typeof req.query.tradeTypes === 'string'
      ? req.query.tradeTypes.split(',').filter(Boolean)
      : undefined;
    const minPrice = typeof req.query.minPrice === 'string' ? Number(req.query.minPrice) : undefined;
    const maxPrice = typeof req.query.maxPrice === 'string' ? Number(req.query.maxPrice) : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'time';

    // 检查数据库连接状态
    try {
      let data = await controllers.listing.list();

      // 关键词筛选
      if (keyword) {
        data = data.filter((item) =>
          item.title.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword) ||
          item.tags?.some(tag => tag.toLowerCase().includes(keyword))
        );
      }

      // 交易类型筛选
      if (tradeTypes && tradeTypes.length > 0) {
        data = data.filter((item) => tradeTypes.includes(item.tradeType));
      }

      // 价格范围筛选
      if (typeof minPrice === 'number' && minPrice >= 0) {
        data = data.filter((item) => item.price >= minPrice);
      }
      if (typeof maxPrice === 'number' && maxPrice > 0) {
        data = data.filter((item) => item.price <= maxPrice);
      }

      // 排序
      switch (sortBy) {
        case 'price_low':
          data.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          data.sort((a, b) => b.price - a.price);
          break;
        case 'time':
        default:
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }

      res.status(200).json({ data });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // 当数据库连接失败时，返回演示数据
      const mockData: ListingPayload[] = [
        {
          id: 'demo-1',
          title: 'iPhone 14 Pro 256GB',
          description: '几乎全新，原装充电器，购买时间3个月',
          price: 7999,
          tradeType: 'sell',
          keywords: ['手机', 'iPhone', '苹果'],
          tags: ['电子产品', '手机'],
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          remainingViews: 50,
          status: 'active',
          viewLimit: 100,
          totalDeals: 0,
          userId: 'demo-user',
          images: []
        },
        {
          id: 'demo-2',
          title: 'MacBook Pro 13寸 M2芯片',
          description: '2023年购入，16GB+512GB，原装配件齐全',
          price: 9999,
          tradeType: 'sell',
          keywords: ['电脑', 'MacBook', '苹果'],
          tags: ['电子产品', '电脑'],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          remainingViews: 80,
          status: 'active',
          viewLimit: 100,
          totalDeals: 2,
          userId: 'demo-user',
          images: []
        },
        {
          id: 'demo-3',
          title: '求购二手相机',
          description: '求购二手单反相机，预算5000元左右',
          price: 5000,
          tradeType: 'buy',
          keywords: ['相机', '单反', '摄影'],
          tags: ['摄影器材'],
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          remainingViews: 30,
          status: 'active',
          viewLimit: 100,
          totalDeals: 0,
          userId: 'demo-user',
          images: []
        }
      ];

      res.status(200).json({
        data: mockData,
        warning: '数据库连接失败，显示演示数据'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      error: '服务器内部错误，请稍后重试',
      ...(process.env.NODE_ENV === 'development' && { message: (error as Error).message })
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  const auth = requireAuth(req);
  const { title, description, price, tradeType = 'sell', keywords, aiAssist } = req.body ?? {};
  if (!title || !description || price === undefined) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    res.status(400).json({ error: '价格无效' });
    return;
  }

  try {
    const record = await controllers.listing.publish({
      userId: auth.sub,
      title: String(title).trim(),
      description: String(description).trim(),
      price: numericPrice,
      tradeType,
      keywords,
      aiAssist: Boolean(aiAssist),
    });
    res.status(201).json({ data: record });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  if (req.method === 'GET') {
    await handleGet(req, res);
    return;
  }
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
