import type { NextApiRequest } from 'next';
import { JwtService } from '../../backend/shared/utils/jwt';
import type { JwtPayload } from '../../backend/shared/domain/user';

const accessJwt = new JwtService(process.env.JWT_SECRET ?? 'dev-secret', 60 * 60 * 24 * 30);

function extractToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization ?? '';
  if (typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
}

export function requireAuth(req: NextApiRequest): JwtPayload {
  const token = extractToken(req);
  if (!token) {
    throw new Error('Missing Authorization header');
  }
  try {
    return accessJwt.verify(token);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function optionalAuth(req: NextApiRequest): JwtPayload | null {
  const token = extractToken(req);
  if (!token) return null;
  try {
    return accessJwt.verify(token);
  } catch {
    return null;
  }
}
