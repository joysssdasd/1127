import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/server/auth';
import { controllers } from '../../../lib/server/controllers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const payload = requireAuth(req);
    const records = await controllers.deal.listPurchases(payload.sub);
    res.status(200).json({ data: records });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}
