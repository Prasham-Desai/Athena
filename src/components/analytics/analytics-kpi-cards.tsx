'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  BookOpen,
  RotateCcw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsKPICardsProps {
  totalHours: number;
  topicsCompleted: number;
  revisionsDone: number;
  avgHoursPerCalendarDay: number;
  avgHoursPerActiveDay: number;
  activeDaysCount: number;
  totalCalendarDays: number;
  prevPeriodComparison?: {
    hoursPercentChange: number | null;
    topicsPercentChange: number | null;
    revisionsPercentChange: number | null;
  };
}

export function AnalyticsKPICards({
  totalHours,
  topicsCompleted,
  revisionsDone,
  avgHoursPerCalendarDay,
  avgHoursPerActiveDay,
  activeDaysCount,
  totalCalendarDays,
  prevPeriodComparison,
}: AnalyticsKPICardsProps) {
  const renderTrendBadge = (pct: number | null | undefined) => {
    if (pct === null || pct === undefined || isNaN(pct)) return null;
    const isPositive = pct >= 0;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          isPositive
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        )}
      >
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(pct)}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Total Study Hours */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Total Study Hours
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            {totalHours.toFixed(1)}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">hrs</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]/50">
          <span>{activeDaysCount} active {activeDaysCount === 1 ? 'day' : 'days'}</span>
          {renderTrendBadge(prevPeriodComparison?.hoursPercentChange)}
        </div>
      </motion.div>

      {/* 2. Topics Completed */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Topics Completed
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            {topicsCompleted}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">topics</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]/50">
          <span>First-time completed</span>
          {renderTrendBadge(prevPeriodComparison?.topicsPercentChange)}
        </div>
      </motion.div>

      {/* 3. Revisions Done */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Revisions Done
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <RotateCcw className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
            {revisionsDone}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">events</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]/50">
          <span>Active recall events</span>
          {renderTrendBadge(prevPeriodComparison?.revisionsPercentChange)}
        </div>
      </motion.div>

      {/* 4. Average Daily Hours (Active Day & Calendar Day) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Avg Daily Hours
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight text-amber-400">
            {avgHoursPerActiveDay.toFixed(1)}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">h / active day</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]/50">
          <span>{avgHoursPerCalendarDay.toFixed(1)}h / cal day</span>
          <span className="text-[10px] text-zinc-500">{totalCalendarDays} days span</span>
        </div>
      </motion.div>
    </div>
  );
}
