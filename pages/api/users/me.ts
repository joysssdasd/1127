import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/server/auth';
import { getUserRepository } from '../../../lib/server/repositories';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const payload = requireAuth(req);
    const repo = getUserRepository();
    const user = await repo.findByPhone(payload.phone);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.status(200).json({ user, isAdmin: payload.role === 'admin' });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}
