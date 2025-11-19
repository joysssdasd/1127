import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { requireAuth } from '../../../lib/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    res.status(400).json({ error: '缺少ID' });
    return;
  }
  if (req.method === 'GET') {
    const listing = await controllers.listing.findById(id);
    if (!listing) {
      res.status(404).json({ error: '信息不存在' });
      return;
    }
    res.status(200).json({ data: listing });
    return;
  }
  if (req.method === 'POST') {
    const action = req.body?.action;
    if (action !== 'republish') {
      res.status(400).json({ error: '未知操作' });
      return;
    }
    try {
      const auth = requireAuth(req);
      const listing = await controllers.listing.republish(id, auth.sub);
      res.status(200).json({ data: listing });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
    return;
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
