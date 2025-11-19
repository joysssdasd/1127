import { useState } from 'react';
import { ListingController } from '../../../../services/listing/listing.controller';
import { useToast } from '../../hooks/useToast';

const controller = new ListingController();

export function ListingForm() {
  const [title, setTitle] = useState('iPhone 15 Pro');
  const [description, setDescription] = useState('国行 256G 全新未拆');
  const [price, setPrice] = useState(8900);
  const { message, show } = useToast();

  const submit = async () => {
    try {
      await controller.publish({ userId: 'seller-1', title, description, price, tradeType: 'sell', aiAssist: true });
      show('发布成功，10积分已扣除');
    } catch (error) {
      show('发布失败: ' + (error as Error).message);
    }
  };

  return (
    <section>
      <h3>发布信息</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述" />
      <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
      <button onClick={submit}>发布</button>
      {message && <div>{message}</div>}
    </section>
  );
}
