import type { NextApiRequest, NextApiResponse } from 'next';

type Announcement = {
  id: string;
  title: string;
  description: string;
  tag: string;
  publishedAt: string;
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ops-001',
    title: '交易风控引擎升级',
    description: '新的成交率回传与异常行为监控已上线，违规账号会被自动标记并限制发布。',
    tag: '风控',
    publishedAt: '2025-11-20T07:00:00.000Z',
  },
  {
    id: 'ops-002',
    title: '短信通道切换至 SPUG',
    description: '验证码下发节点切换完成，触发 targets 参数即可实时指定推送对象，建议同步白名单。',
    tag: '通道',
    publishedAt: '2025-11-19T15:30:00.000Z',
  },
  {
    id: 'ops-003',
    title: '榜单与积分周报',
    description: '新增周度积分与成交榜单，管理员可在后台下载数据透视表进行复盘。',
    tag: '洞察',
    publishedAt: '2025-11-18T10:00:00.000Z',
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  res.status(200).json({ data: ANNOUNCEMENTS });
}
