import type { NextApiRequest, NextApiResponse } from 'next';
import type { SearchQuery } from '../../../backend/shared/contracts/search';
import { controllers } from '../../../lib/server/controllers';
import { optionalAuth } from '../../../lib/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
  if (!keyword) {
    res.status(400).json({ error: '请输入关键词' });
    return;
  }
  const auth = optionalAuth(req);
  try {
    const payload: SearchQuery = { keyword };
    if (auth?.sub) {
      payload.userId = auth.sub;
    }
    const data = await controllers.search.search(payload);
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
