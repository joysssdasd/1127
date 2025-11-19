import type { NextApiRequest, NextApiResponse } from 'next';
import { DealController } from '../../backend/services/deal/contact-view.controller';
import { ListingController } from '../../backend/services/listing/listing.controller';
import type { PurchaseContactResult } from '../../backend/shared/contracts/deal';

type ContactResponse = {
  data?: PurchaseContactResult;
  error?: string;
};

const dealController = new DealController();
const listingController = new ListingController();

export default async function handler(req: NextApiRequest, res: NextApiResponse<ContactResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { buyerPhone, postId } = req.body ?? {};
  if (!buyerPhone || !postId) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }

  try {
    const listing = await listingController.findById(String(postId).trim());
    if (!listing) {
      res.status(404).json({ error: '信息不存在' });
      return;
    }

    const result = await dealController.purchaseContact({
      postId: listing.id,
      buyerId: String(buyerPhone).trim(),
      sellerId: listing.userId,
      price: listing.price,
    });
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
