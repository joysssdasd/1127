import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { requireAuth } from '../../../lib/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const auth = requireAuth(req);
  const all = await controllers.listing.list();
  const mine = all.filter((item) => item.userId === auth.sub);
  res.status(200).json({ data: mine });
}
