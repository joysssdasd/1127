import { useEffect, useState } from 'react';
import { fetchHistory, clearHistory } from './services/searchApi';

interface Props {
  userId: string;
  onKeywordSelect: (keyword: string) => void;
}

export function SearchHistoryList({ userId, onKeywordSelect }: Props) {
  const [items, setItems] = useState<string[]>([]);

  const load = () => {
    fetchHistory(userId).then(setItems);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const clear = async () => {
    await clearHistory(userId);
    load();
  };

  return (
    <div>
      <header>
        <span>最近搜索</span>
        <button onClick={clear}>清空</button>
      </header>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <button onClick={() => onKeywordSelect(item)}>{item}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
