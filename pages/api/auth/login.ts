import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { phone, password, code, wechat } = req.body ?? {};
  if (!phone) {
    res.status(400).json({ error: '请输入手机号' });
    return;
  }
  if (!password && !code) {
    res.status(400).json({ error: '请填写密码或验证码' });
    return;
  }
  try {
    const result = await controllers.auth.login({ phone, password, code, wechat });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
