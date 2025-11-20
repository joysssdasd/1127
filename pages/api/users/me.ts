import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { requireAuth } from '../../../lib/server/auth';
import { getUserRepository } from '../../../lib/server/repositories';
import type { UserProfile } from '../../../backend/shared/domain/user';
import { Errors } from '../../../backend/shared/utils/errors';

function stripSensitive(user: UserProfile): UserProfile {
  const safe: UserProfile = { ...user };
  delete safe.passwordHash;
  return safe;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = requireAuth(req);
    const repo = getUserRepository();
    const user = await repo.findByPhone(payload.phone);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.status(200).json({ user: stripSensitive(user), isAdmin: payload.role === 'admin' });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = requireAuth(req);
    const repo = getUserRepository();
    const user = await repo.findByPhone(payload.phone);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const { wechat, password } = req.body ?? {};
    let hasChanges = false;

    if (typeof wechat === 'string') {
      const trimmed = wechat.trim();
      if (trimmed.length > 0) {
        user.wechat = trimmed;
        hasChanges = true;
      }
    }

    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        res.status(Errors.PasswordTooWeak.status).json({ error: Errors.PasswordTooWeak.message });
        return;
      }
      user.passwordHash = await bcrypt.hash(password, 10);
      hasChanges = true;
    }

    if (!hasChanges) {
      res.status(400).json({ error: '未检测到需要更新的字段' });
      return;
    }

    const updated = await repo.update(user);
    res.status(200).json({ user: stripSensitive(updated) });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    await handleGet(req, res);
    return;
  }
  if (req.method === 'PATCH') {
    await handlePatch(req, res);
    return;
  }
  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
