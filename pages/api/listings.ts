import type { NextApiRequest, NextApiResponse } from 'next';
import { ListingController } from '../../backend/services/listing/listing.controller';
import type { ListingPayload } from '../../backend/shared/contracts/listing';

type ListingsResponse = {
  data?: ListingPayload | ListingPayload[];
  error?: string;
};

const controller = new ListingController();

async function handleGet(res: NextApiResponse<ListingsResponse>) {
  try {
    const data = await controller.list();
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  const { sellerPhone, title, description, price } = req.body ?? {};
  if (!sellerPhone || !title || !description || price === undefined) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    res.status(400).json({ error: '价格无效' });
    return;
  }

  try {
    const record = await controller.publish({
      userId: String(sellerPhone).trim(),
      title: String(title).trim(),
      description: String(description).trim(),
      price: numericPrice,
      tradeType: 'sell',
    });
    res.status(201).json({ data: record });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListingsResponse>) {
  if (req.method === 'GET') {
    await handleGet(res);
    return;
  }
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method Not Allowed' });
}
