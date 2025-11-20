import { useCallback, useEffect, useRef, useState } from 'react';

type PullToRefreshOptions = {
  threshold?: number;
};

export function usePullToRefresh(onRefresh: () => Promise<unknown> | unknown, options?: PullToRefreshOptions) {
  const [distance, setDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullDistance = useRef(0);
  const callbackRef = useRef(onRefresh);
  const threshold = options?.threshold ?? 90;

  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await callbackRef.current();
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY <= 4 && !refreshing) {
        startY.current = event.touches[0]?.clientY ?? null;
      } else {
        startY.current = null;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (startY.current === null) return;
      const current = event.touches[0]?.clientY ?? 0;
      const delta = current - startY.current;
      if (delta > 0) {
        setPulling(true);
        const clamped = Math.min(delta, 180);
        pullDistance.current = clamped;
        setDistance(clamped);
      } else {
        setPulling(false);
        pullDistance.current = 0;
        setDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance.current >= threshold && !refreshing) {
        triggerRefresh();
      }
      pullDistance.current = 0;
      startY.current = null;
      setPulling(false);
      setDistance(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [refreshing, threshold, triggerRefresh]);

  return { pulling, distance, refreshing };
}
