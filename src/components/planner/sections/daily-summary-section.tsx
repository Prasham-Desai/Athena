'use client';

import { CheckSquare, BookOpen, Clock, Sparkles } from 'lucide-react';
import { formatDurationHuman } from '@/lib/study-analytics';
import { Skeleton } from '@/components/ui/loading';

interface DailySummarySectionProps {
  completedTasksCount: number;
  totalTasksTodayCount: number;
  pendingTasksCount: number;
  studyLogsCount: number;
  manualLogMinutes: number;
  actualStudyMinutes: number;
  overlappingMinutes: number;
  isLoading?: boolean;
}

export function DailySummarySection({
  completedTasksCount,
  totalTasksTodayCount,
  pendingTasksCount,
  studyLogsCount,
  manualLogMinutes,
  actualStudyMinutes,
  overlappingMinutes,
  isLoading = false,
}: DailySummarySectionProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
      {/* 1. Tasks Done */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
          <span>Tasks Done</span>
          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[hsl(var(--foreground))]">
            {isLoading ? <Skeleton className="h-8 w-12 rounded-md" /> : completedTasksCount}
          </span>
          {isLoading ? <Skeleton className="h-3 w-16 rounded-md" /> : (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              / {totalTasksTodayCount} today
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))] truncate">
          {isLoading ? <Skeleton className="h-3 w-28 rounded-md" /> : totalTasksTodayCount === 0
            ? 'No tasks due today'
            : completedTasksCount >= totalTasksTodayCount
            ? 'All tasks completed! 🎉'
            : `${totalTasksTodayCount - completedTasksCount} due remaining`}
        </p>
      </div>

      {/* 2. Study Logs */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
          <span>Study Logs</span>
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[hsl(var(--foreground))]">
            {isLoading ? <Skeleton className="h-8 w-12 rounded-md" /> : studyLogsCount}
          </span>
          <span className="text-xs text-indigo-400 font-semibold">
            {isLoading ? <Skeleton className="h-4 w-14 rounded-md" /> : `(${formatDurationHuman(manualLogMinutes)})`}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))] truncate">
          {isLoading ? <Skeleton className="h-3 w-32 rounded-md" /> : studyLogsCount === 0 ? 'No logs added today' : `${studyLogsCount} logged study sessions`}
        </p>
      </div>

      {/* 3. Actual Study Time (Verified Deduplicated) */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-500 uppercase tracking-wider mb-2">
          <span>Actual Study</span>
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-500">
            {isLoading ? <Skeleton className="h-8 w-24 rounded-md" /> : formatDurationHuman(actualStudyMinutes)}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-emerald-600/80 dark:text-emerald-400/80 truncate">
          {isLoading ? <Skeleton className="h-3 w-32 rounded-md" /> : overlappingMinutes > 0
            ? `Verified (${overlappingMinutes}m overlap deduplicated)`
            : 'Verified timer & study logs'}
        </p>
      </div>

      {/* 4. Remaining Tasks */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm min-w-0">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
          <span>Remaining Tasks</span>
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[hsl(var(--foreground))]">
            {isLoading ? <Skeleton className="h-8 w-12 rounded-md" /> : pendingTasksCount}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">pending</span>
        </div>
        <p className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))] truncate">
          {isLoading ? <Skeleton className="h-3 w-28 rounded-md" /> : pendingTasksCount === 0 ? 'Queue is clear!' : `${pendingTasksCount} total tasks in queue`}
        </p>
      </div>
    </section>
  );
}
