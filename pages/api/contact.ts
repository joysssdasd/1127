import type { NextApiRequest, NextApiResponse } from 'next';
import type { PurchaseContactResult } from '../../backend/shared/contracts/deal';
import { controllers } from '../../lib/server/controllers';
import { requireAuth } from '../../lib/server/auth';

type ContactResponse = {
  data?: PurchaseContactResult;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ContactResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const auth = requireAuth(req);
  const { postId } = req.body ?? {};
  if (!postId) {
    res.status(400).json({ error: '缺少信息ID' });
    return;
  }

  try {
    const listing = await controllers.listing.findById(String(postId).trim());
    if (!listing) {
      res.status(404).json({ error: '信息不存在' });
      return;
    }

    const result = await controllers.deal.purchaseContact({
      postId: listing.id,
      buyerId: auth.sub,
      sellerId: listing.userId,
      price: listing.price,
    });
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
