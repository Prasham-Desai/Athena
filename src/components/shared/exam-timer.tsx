'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  targetDate: string; // YYYY-MM-DD (assuming start of day for simplicity, or 23:59:59)
}

export function ExamTimer({ targetDate }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [daysTotal, setDaysTotal] = useState<number>(0);

  useEffect(() => {
    // Parse targetDate as midnight in local time
    const target = new Date(`${targetDate}T00:00:00`).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
        setDaysTotal(difference / (1000 * 60 * 60 * 24));
      } else {
        setTimeLeft(null);
        setDaysTotal(0);
      }
    };

    calculateTimeLeft(); // initial calc
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <div className="text-sm font-bold text-emerald-500">Exam has started!</div>;
  }

  // Color logic: Green (>15), Yellow (<15), Red (<5)
  let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30";
  if (daysTotal < 5) {
    colorClass = "text-red-500 bg-red-500/10 border-red-200 dark:border-red-500/30";
  } else if (daysTotal < 15) {
    colorClass = "text-amber-500 bg-amber-500/10 border-amber-200 dark:border-amber-500/30";
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm tracking-widest font-bold shadow-sm", colorClass)}>
      <span>{pad(timeLeft.d)}<span className="text-[10px] uppercase ml-0.5 opacity-70 tracking-normal font-sans">d</span></span>
      <span className="opacity-50">:</span>
      <span>{pad(timeLeft.h)}<span className="text-[10px] uppercase ml-0.5 opacity-70 tracking-normal font-sans">h</span></span>
      <span className="opacity-50">:</span>
      <span>{pad(timeLeft.m)}<span className="text-[10px] uppercase ml-0.5 opacity-70 tracking-normal font-sans">m</span></span>
      <span className="opacity-50">:</span>
      <span>{pad(timeLeft.s)}<span className="text-[10px] uppercase ml-0.5 opacity-70 tracking-normal font-sans">s</span></span>
    </div>
  );
}
