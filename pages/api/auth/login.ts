import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { phone, password, code } = req.body ?? {};
  if (!phone || !password || !code) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  try {
    const result = await controllers.auth.login({ phone, password, code });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
