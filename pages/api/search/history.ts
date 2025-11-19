import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { requireAuth } from '../../../lib/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireAuth(req);
  if (req.method === 'GET') {
    const history = await controllers.search.history(auth.sub);
    res.status(200).json({ data: history });
    return;
  }
  if (req.method === 'DELETE') {
    await controllers.search.clearHistory(auth.sub);
    res.status(200).json({ success: true });
    return;
  }
  res.setHeader('Allow', ['GET', 'DELETE']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
