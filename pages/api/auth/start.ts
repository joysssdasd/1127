import type { NextApiRequest, NextApiResponse } from 'next';
import { controllers } from '../../../lib/server/controllers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const deviceId = String(req.body?.deviceId ?? `device-${Date.now()}`);
  const code = String(req.body?.code ?? `code-${Date.now()}`);
  const state = `state-${Math.random().toString(36).slice(2)}`;
  const nonce = `nonce-${Math.random().toString(36).slice(2)}`;
  controllers.auth.issueState(state, nonce, deviceId);
  try {
    const result = await controllers.auth.startWeChatLogin({
      state,
      nonce,
      code,
      device: { deviceId },
    });
    res.status(200).json({ ...result, deviceId });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
