import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    deployTime: new Date().toISOString(),
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  });
}