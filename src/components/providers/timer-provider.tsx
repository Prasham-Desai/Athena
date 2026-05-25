'use client';

import { useEffect } from 'react';
import { useTimerStore } from '@/store/timer-store';
import { useSettingsStore } from '@/store/settings-store';

export function TimerProvider() {
  const { tick, pomoSecondsLeft, pomoMode, isPomoRunning, setPomoMode } = useTimerStore();
  const { settings } = useSettingsStore();

  // Tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Handle Pomodoro completion
  useEffect(() => {
    if (pomoSecondsLeft === 0 && !isPomoRunning) {
      if (pomoMode === 'study') {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Study session complete! Take a break.', type: 'info' } }));
        setPomoMode('break', settings.breakMinutes);
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Break is over! Time to focus.', type: 'info' } }));
        setPomoMode('study', settings.pomodoroMinutes);
      }
    }
  }, [pomoSecondsLeft, isPomoRunning, pomoMode, setPomoMode, settings]);

  return null;
}
