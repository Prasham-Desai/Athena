'use client';

import { useEffect } from 'react';
import { useTimerStore } from '@/store/timer-store';

export function TimerProvider() {
  const { tick } = useTimerStore();

  // Tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return null;
}
