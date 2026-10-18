'use client';

import { useState } from 'react';
import { Timer, Play, Pause, Save, RotateCcw, Clock, Target, BookOpen, CheckSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getToday } from '@/lib/utils';
import { useTimerStore, type ActiveTimerTarget } from '@/store/timer-store';
import { useActivityStore } from '@/store/activity-store';
import { useSettingsStore } from '@/store/settings-store';
import { ProgressRing } from '@/components/shared/progress-ring';

export function FocusTimerCard({
  date = getToday(),
  todayActualMinutes,
  onSwitchActivityPrompt,
}: {
  date?: string;
  todayActualMinutes?: number;
  onSwitchActivityPrompt?: (newTarget: ActiveTimerTarget) => void;
}) {
  const {
    isMainRunning,
    mainSeconds,
    activeTarget,
    toggleMain,
    resetMain,
    setActiveTarget,
    segmentStartTime,
  } = useTimerStore();

  const { addStudySession, dailyLogs } = useActivityStore();
  const { settings } = useSettingsStore();

  const log = dailyLogs.find((l) => l.date === date);
  const totalMinutes = todayActualMinutes !== undefined ? todayActualMinutes : (log?.studyMinutes ?? 0);
  const goalMinutes = (settings.dailyStudyGoalHours || 8) * 60;
  const progressPct = goalMinutes > 0 ? Math.min(100, Math.round((totalMinutes / goalMinutes) * 100)) : 0;

  const formatSecs = (s: number) => {
    const hours = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
      return `${hours}:${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    const now = new Date();
    if (isMainRunning && segmentStartTime) {
      // Log segment
      const start = new Date(segmentStartTime);
      const diffMins = Math.round((now.getTime() - start.getTime()) / 60000);
      if (diffMins > 0) {
        addStudySession(date, {
          startTime: segmentStartTime,
          endTime: now.toISOString(),
          durationMinutes: diffMins,
          type: activeTarget?.type === 'task' ? 'task' : activeTarget?.type === 'study-block' ? 'study-block' : 'timer',
          title: activeTarget?.title || 'Stopwatch Session',
          taskId: activeTarget?.taskId,
          studyBlockId: activeTarget?.studyBlockId,
        });
      }
    }
    toggleMain();
  };

  const handleSaveSession = () => {
    const now = new Date();
    if (isMainRunning && segmentStartTime) {
      const start = new Date(segmentStartTime);
      const diffMins = Math.round((now.getTime() - start.getTime()) / 60000);
      if (diffMins > 0) {
        addStudySession(date, {
          startTime: segmentStartTime,
          endTime: now.toISOString(),
          durationMinutes: diffMins,
          type: activeTarget?.type === 'task' ? 'task' : activeTarget?.type === 'study-block' ? 'study-block' : 'timer',
          title: activeTarget?.title || 'Stopwatch Session',
          taskId: activeTarget?.taskId,
          studyBlockId: activeTarget?.studyBlockId,
        });
      }
    }

    const savedMins = Math.max(1, Math.round(mainSeconds / 60));
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          message: `Saved ${savedMins} minutes of focus time for "${activeTarget?.title || 'Session'}"!`,
          type: 'success',
        },
      })
    );

    resetMain();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-[hsl(var(--card))] to-purple-500/10 p-5 sm:p-6 shadow-sm">
      {/* Decorative ambient glows */}
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Stopwatch & Activity Target */}
        <div className="flex-1 w-full space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Timer className="w-3.5 h-3.5" />
              Timer
            </span>

            {/* Target indicator pill */}
            {activeTarget ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--foreground))]">
                {activeTarget.type === 'task' ? (
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                ) : activeTarget.type === 'study-block' ? (
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                ) : (
                  <Target className="w-3 h-3 text-purple-400" />
                )}
                <span className="truncate max-w-[180px] font-semibold">{activeTarget.title}</span>
                {!isMainRunning && (
                  <button
                    onClick={() => setActiveTarget(null)}
                    className="ml-1 text-[hsl(var(--muted-foreground))] hover:text-red-400 text-[10px] uppercase font-bold"
                  >
                    Clear
                  </button>
                )}
              </span>
            ) : (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                General Study Session (Select any task or block to time)
              </span>
            )}
          </div>

          {/* Time digits */}
          <div className="font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-tight tabular-nums text-[hsl(var(--foreground))]">
            {formatSecs(mainSeconds)}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={handleToggle}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95',
                isMainRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-500/25 ring-2 ring-amber-400/50'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-indigo-500/25'
              )}
            >
              {isMainRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {mainSeconds > 0 ? 'Resume Timer' : 'Start Timer'}
                </>
              )}
            </button>

            {mainSeconds > 0 && (
              <button
                onClick={handleSaveSession}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                Save Session
              </button>
            )}

            {mainSeconds > 0 && !isMainRunning && (
              <button
                onClick={resetMain}
                className="inline-flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-[hsl(var(--muted))] text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-red-400 transition"
                title="Discard timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right: Daily Progress Ring */}
        <div className="flex flex-col items-center justify-center shrink-0 p-3 rounded-2xl bg-[hsl(var(--card))]/60 border border-[hsl(var(--border))] backdrop-blur-sm">
          <ProgressRing
            value={progressPct}
            size={110}
            strokeWidth={8}
            color={progressPct >= 100 ? '#22c55e' : '#6366f1'}
            bgColor="hsl(var(--muted))"
            sublabel="daily goal"
          />
          <div className="mt-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Total Studied Today
            </p>
            <p className="text-sm font-bold text-emerald-500">
              {Math.floor(totalMinutes / 60)}h {(totalMinutes % 60).toString().padStart(2, '0')}m
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
