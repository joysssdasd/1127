import { useEffect, useState } from 'react';

export function useReminder(interval = 60000, fetchCount: () => Promise<number>) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loop = async () => {
      const value = await fetchCount();
      if (mounted) setCount(value);
    };
    loop();
    const timer = setInterval(loop, interval);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [interval, fetchCount]);

  return count;
}
