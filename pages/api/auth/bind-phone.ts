import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';
import { getUserRepository } from '../../../lib/server/repositories';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { sessionToken, phone, otp } = req.body ?? {};
  if (!sessionToken || !phone || !otp) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  try {
    const tokens = await controllers.auth.bindPhone({ sessionToken, phone, otp });
    const user = await getUserRepository().findByPhone(String(phone));
    res.status(200).json({ tokens, user });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
