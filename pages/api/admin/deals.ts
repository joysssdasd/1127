import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { requireAdmin } from '../../../lib/server/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireAdmin(req);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
    return;
  }

  if (req.method === 'GET') {
    const data = await controllers.deal.pending(new Date());
    res.status(200).json({ data });
    return;
  }
  if (req.method === 'POST') {
    const { action } = req.body ?? {};
    if (action === 'remind') {
      const count = await controllers.deal.remind(new Date());
      res.status(200).json({ reminded: count });
      return;
    }
    res.status(400).json({ error: '未知操作' });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
