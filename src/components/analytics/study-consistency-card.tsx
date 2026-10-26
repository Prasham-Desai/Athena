'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, CalendarCheck2, Activity, Zap, TrendingUp } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import type { StreakStats } from '@/lib/analytics-calculations';
import type { DailyLog } from '@/types';
import { cn } from '@/lib/utils';

interface StudyConsistencyCardProps {
  stats: StreakStats;
  dailyLogs: DailyLog[];
}

export function StudyConsistencyCard({ stats, dailyLogs }: StudyConsistencyCardProps) {
  // Generate last 14 days activity pills
  const recentDays = useMemo(() => {
    const today = new Date();
    const activeDates = new Set(
      dailyLogs.filter((l) => l.studyMinutes > 0 || l.topicsCompleted > 0).map((l) => l.date)
    );

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const dayShort = format(d, 'EEE');
      const dateNum = format(d, 'd');
      const isActive = activeDates.has(dStr);
      days.push({
        dateStr: dStr,
        dayShort,
        dateNum,
        isActive,
      });
    }
    return days;
  }, [dailyLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Study Consistency & Streaks
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Habit durability, streaks, and study cadence
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          {stats.consistencyRate}% Consistency
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            Current Streak
          </div>
          <div className="text-xl font-bold text-[hsl(var(--foreground))] mt-1 flex items-baseline gap-1">
            {stats.currentStreak}
            <span className="text-xs font-normal text-zinc-400">days</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {stats.currentStreak > 0 ? 'Active momentum' : 'Ready to start'}
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            Longest Streak
          </div>
          <div className="text-xl font-bold text-[hsl(var(--foreground))] mt-1 flex items-baseline gap-1">
            {stats.longestStreak}
            <span className="text-xs font-normal text-zinc-400">days</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Personal best</div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-400" />
            Active Days
          </div>
          <div className="text-xl font-bold text-[hsl(var(--foreground))] mt-1 flex items-baseline gap-1">
            {stats.totalActiveDays}
            <span className="text-xs font-normal text-zinc-400">days</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Recorded study days</div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            Cadence
          </div>
          <div className="text-xl font-bold text-[hsl(var(--foreground))] mt-1 flex items-baseline gap-1">
            {stats.studyDayFrequency}
            <span className="text-xs font-normal text-zinc-400">days/wk</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Average weekly frequency</div>
        </div>
      </div>

      {/* Recent 14-day Activity Strip */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-3">
        <div className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] mb-2 flex items-center justify-between">
          <span>Recent 14-Day Cadence</span>
          <span className="text-[10px] text-zinc-500">Today on right</span>
        </div>
        <div className="grid grid-cols-14 gap-1 sm:gap-1.5">
          {recentDays.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.isActive ? 'Active study day' : 'Rest day'}`}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  'w-full aspect-square rounded-[4px] border transition-all duration-200 flex items-center justify-center text-[10px] font-bold',
                  day.isActive
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-800/40 border-white/[0.04] text-zinc-600'
                )}
              >
                {day.dateNum}
              </div>
              <span className="text-[8px] text-zinc-500 uppercase">{day.dayShort[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
