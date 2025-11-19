import type { NextApiRequest, NextApiResponse } from 'next';
import type { ListingPayload } from '../../backend/shared/contracts/listing';
import { controllers } from '../../lib/server/controllers';
import { requireAuth } from '../../lib/server/auth';

type ListingsResponse = {
  data?: ListingPayload | ListingPayload[];
  error?: string;
};

async function handleGet(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.toLowerCase() : undefined;
    const data = await controllers.listing.list();
    const filtered = keyword
      ? data.filter((item) => item.title.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword))
      : data;
    res.status(200).json({ data: filtered });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  const auth = requireAuth(req);
  const { title, description, price, tradeType = 'sell', keywords, aiAssist } = req.body ?? {};
  if (!title || !description || price === undefined) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    res.status(400).json({ error: '价格无效' });
    return;
  }

  try {
    const record = await controllers.listing.publish({
      userId: auth.sub,
      title: String(title).trim(),
      description: String(description).trim(),
      price: numericPrice,
      tradeType,
      keywords,
      aiAssist: Boolean(aiAssist),
    });
    res.status(201).json({ data: record });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  if (req.method === 'GET') {
    await handleGet(req, res);
    return;
  }
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
