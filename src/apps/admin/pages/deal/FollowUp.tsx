import { useEffect, useState } from 'react';
import { DealController } from '../../../../services/deal/contact-view.controller';

const controller = new DealController();

export function DealFollowUp() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const pending = await controller.pending(new Date());
    setItems(pending);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <h3>成交回执待跟进</h3>
      <ul>
        {items.map((item: any) => (
          <li key={item.id}>
            买家 {item.buyerId} 尚未反馈，截止 {item.confirmDeadline.toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
