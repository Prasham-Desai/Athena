'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UndoEntry {
  topicId: string;
  topicName: string;
  subjectName: string;
  chapterId: string;
  subjectId: string;
  timestamp: number;
}

interface RevisionUndoToastProps {
  entries: UndoEntry[];
  onUndo: (entry: UndoEntry) => void;
  onUndoAll: () => void;
  onDismiss: () => void;
  undoWindowSeconds?: number;
}

const DEFAULT_UNDO_WINDOW_SECONDS = 15;

export function RevisionUndoToast({
  entries,
  onUndo,
  onUndoAll,
  onDismiss,
  undoWindowSeconds = DEFAULT_UNDO_WINDOW_SECONDS,
}: RevisionUndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisible = entries.length > 0;
  const isBatch = entries.length > 1;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isVisible) {
      clearTimer();
      return;
    }

    clearTimer();
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, undoWindowSeconds * 1000);

    return () => {
      clearTimer();
    };
  }, [isVisible, undoWindowSeconds, onDismiss, clearTimer, entries]);

  const handleUndo = useCallback(() => {
    clearTimer();
    if (isBatch) {
      onUndoAll();
    } else if (entries.length === 1) {
      onUndo(entries[0]);
    }
  }, [clearTimer, isBatch, onUndoAll, onUndo, entries]);

  const handleDismiss = useCallback(() => {
    clearTimer();
    onDismiss();
  }, [clearTimer, onDismiss]);

  const getMessage = () => {
    if (isBatch) {
      return (
        <span className="text-sm text-[hsl(var(--foreground))]">
          <span className="font-semibold">{entries.length} topics</span>{' '}
          marked as revised
        </span>
      );
    }

    const entry = entries[0];
    return (
      <span className="text-sm text-[hsl(var(--foreground))]">
        <span className="font-semibold line-clamp-1">
          {entry.subjectName} – {entry.topicName}
        </span>{' '}
        <span className="text-[hsl(var(--muted-foreground))]">
          marked as revised
        </span>
      </span>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={entries.map((e) => e.topicId).join('-')}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
            mass: 0.8,
          }}
          className={cn(
            'fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50',
            'max-w-md w-[90%]',
            'bg-[hsl(var(--card))]/95 backdrop-blur-xl',
            'border border-[hsl(var(--border))] rounded-2xl shadow-2xl',
            'overflow-hidden'
          )}
        >
          {/* Main Content */}
          <div className="relative flex items-center gap-3 p-3 sm:p-3.5">
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 flex items-center justify-center',
                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
                'bg-violet-500/10'
              )}
            >
              <RotateCcw className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-violet-400" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0 pr-6">{getMessage()}</div>

            {/* Undo Button */}
            <button
              onClick={handleUndo}
              className={cn(
                'flex-shrink-0 text-sm font-medium',
                'text-violet-400 hover:bg-violet-500/10',
                'rounded-lg px-3 py-1.5 sm:px-3 sm:py-1.5',
                'min-h-[36px] sm:min-h-0',
                'transition-colors duration-200',
                'active:scale-95'
              )}
            >
              {isBatch ? 'Undo All' : 'Undo'}
            </button>

            {/* Dismiss X */}
            <button
              onClick={handleDismiss}
              className={cn(
                'absolute top-1.5 right-1.5',
                'flex items-center justify-center',
                'w-6 h-6 rounded-full',
                'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
                'hover:bg-[hsl(var(--muted))]/50',
                'transition-colors duration-200'
              )}
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full h-0.5 bg-[hsl(var(--muted))]/30">
            <motion.div
              key={entries.map((e) => e.topicId).join('-') + '-bar'}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{
                duration: undoWindowSeconds,
                ease: 'linear',
              }}
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
