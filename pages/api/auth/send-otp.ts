import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { phone, otp: otpInput } = req.body ?? {};
  if (!phone) {
    res.status(400).json({ error: '手机号必填' });
    return;
  }
  const otp = otpInput ?? '123456';
  controllers.auth.issueOtp(String(phone), String(otp));
  res.status(200).json({ success: true, otp });
}
