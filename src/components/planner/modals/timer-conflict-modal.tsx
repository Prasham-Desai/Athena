'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import type { ActiveTimerTarget } from '@/store/timer-store';

interface TimerConflictModalProps {
  isOpen: boolean;
  currentTarget: ActiveTimerTarget | null;
  newTarget: ActiveTimerTarget;
  elapsedSeconds: number;
  onCancel: () => void;
  onSaveAndSwitch: () => void;
  onDiscardAndSwitch: () => void;
}

export function TimerConflictModal({
  isOpen,
  currentTarget,
  newTarget,
  elapsedSeconds,
  onCancel,
  onSaveAndSwitch,
  onDiscardAndSwitch,
}: TimerConflictModalProps) {
  if (!isOpen) return null;

  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const currentTitle = currentTarget?.title || 'Current Stopwatch Session';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">Active Session in Progress</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">A focus session is currently tracking</p>
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-3.5 mb-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Currently Tracking:</span>
              <span className="font-semibold text-[hsl(var(--foreground))] truncate max-w-[200px]">{currentTitle}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Elapsed Time:</span>
              <span className="font-mono font-bold text-emerald-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeFormatted}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[hsl(var(--border))]">
              <span className="text-[hsl(var(--muted-foreground))]">Switching to:</span>
              <span className="font-semibold text-indigo-400 truncate max-w-[200px]">{newTarget.title}</span>
            </div>
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
            Would you like to save your elapsed time for <strong className="text-[hsl(var(--foreground))]">"{currentTitle}"</strong> before starting your new session?
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={onSaveAndSwitch}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              Save Elapsed Time & Switch
            </button>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
              >
                Keep Current Session
              </button>
              <button
                onClick={onDiscardAndSwitch}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
