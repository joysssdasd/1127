import { useState } from 'react';
import { DealController } from '../../../../services/deal/contact-view.controller';
import { useToast } from '../../hooks/useToast';

const controller = new DealController();

export function ContactPurchase() {
  const [postId, setPostId] = useState('post-1');
  const { message, show } = useToast();

  const purchase = async () => {
    try {
      const result = await controller.purchaseContact({ postId, buyerId: 'buyer-h5', sellerId: 'seller-1', price: 1 });
      show(`微信号已复制，凭证:${result.contactToken}`);
    } catch (error) {
      show('购买失败:' + (error as Error).message);
    }
  };

  return (
    <section>
      <h3>购买联系方式</h3>
      <input value={postId} onChange={(e) => setPostId(e.target.value)} />
      <button onClick={purchase}>花1积分获取微信</button>
      {message && <div>{message}</div>}
    </section>
  );
}
