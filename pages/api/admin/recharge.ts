import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { requireAuth } from '../../../lib/server/auth';
import { Errors } from '../../../backend/shared/utils/errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let adminId: string;
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'admin') {
      throw Errors.AdminOnly;
    }
    adminId = payload.phone;
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
    return;
  }
  if (req.method === 'GET') {
    const data = await controllers.recharge.pending();
    res.status(200).json({ data });
    return;
  }

  if (req.method === 'POST') {
    const { id, action } = req.body ?? {};
    if (!id || !action) {
      res.status(400).json({ error: '缺少参数' });
      return;
    }
    try {
      if (action === 'approve') {
        await controllers.recharge.approve(String(id), adminId);
      } else if (action === 'reject') {
        await controllers.recharge.reject(String(id), adminId);
      } else {
        res.status(400).json({ error: '未知操作' });
        return;
      }
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
