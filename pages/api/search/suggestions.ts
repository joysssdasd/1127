import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { optionalAuth } from '../../../lib/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const prefix = typeof req.query.prefix === 'string' ? req.query.prefix : '';
  if (!prefix) {
    res.status(400).json({ error: '缺少前缀' });
    return;
  }
  const auth = optionalAuth(req);
  const data = await controllers.search.suggestions(prefix, auth?.sub);
  res.status(200).json({ data });
}
