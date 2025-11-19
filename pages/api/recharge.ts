import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../lib/server/controllers';
import { requireAuth } from '../../lib/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const auth = requireAuth(req);
  const { amount, voucherUrl } = req.body ?? {};
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    res.status(400).json({ error: '充值金额无效' });
    return;
  }
  if (!voucherUrl) {
    res.status(400).json({ error: '请上传凭证链接' });
    return;
  }
  const task = await controllers.recharge.request(auth.sub, numericAmount, String(voucherUrl));
  res.status(201).json({ data: task });
}
