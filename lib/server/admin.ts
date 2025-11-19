import type { NextApiRequest } from 'next';

export function requireAdmin(req: NextApiRequest): void {
  const expected = process.env.ADMIN_API_KEY ?? 'admin-demo';
  const provided = req.headers['x-admin-key'];
  if (provided !== expected) {
    throw new Error('无权访问');
  }
}
