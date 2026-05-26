import { useState, useEffect } from 'react';
import { getToday } from '@/lib/utils';

export function useToday() {
  const [today, setToday] = useState(getToday());

  useEffect(() => {
    const checkDate = () => {
      const current = getToday();
      if (current !== today) {
        setToday(current);
      }
    };
    
    const interval = setInterval(checkDate, 60000); // Check every minute
    window.addEventListener('visibilitychange', checkDate);
    window.addEventListener('focus', checkDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', checkDate);
      window.removeEventListener('focus', checkDate);
    };
  }, [today]);

  return today;
}
