import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const phone = String(req.body?.phone ?? '').trim();
  if (!phone) {
    res.status(400).json({ error: '请输入手机号' });
    return;
  }
  try {
    await controllers.auth.sendCode(phone);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
