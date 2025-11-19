import { useEffect, useState } from 'react';
import { ListingController } from '../../../../services/listing/listing.controller';

const controller = new ListingController();

export function ListingList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    controller.list().then(setItems);
  }, []);

  return (
    <section>
      <h3>最新信息</h3>
      <ul>
        {items.map((item: any) => (
          <li key={item.id}>
            <strong>{item.title}</strong> ¥{item.price} ｜ 成交{item.totalDeals}次 ｜ 剩余{item.remainingViews}/{item.viewLimit}
          </li>
        ))}
      </ul>
    </section>
  );
}
