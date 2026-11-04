'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Flame,
} from 'lucide-react';

import { StatCard } from '@/components/shared/stat-card';
import { ProgressRing } from '@/components/shared/progress-ring';
import type { Subject } from '@/types';
import { isOverdue, isToday } from '@/lib/utils';
import { Skeleton } from '@/components/ui/loading';

interface RevisionStatsHeaderProps {
  subjects: Subject[];
  isLoading?: boolean;
}

export function RevisionStatsHeader({ subjects, isLoading = false }: RevisionStatsHeaderProps) {
  const stats = useMemo(() => {
    let totalTopics = 0;
    let completedTopics = 0;
    let revisedAtLeastOnce = 0;
    let totalRevisionCount = 0;
    let dueForRevision = 0;
    let revisedToday = 0;

    subjects.forEach((s) => {
      s.chapters.forEach((c) => {
        c.topics.forEach((t) => {
          totalTopics++;
          if (t.status === 'completed' || t.status === 'revised') completedTopics++;
          if (t.revisionCount > 0) revisedAtLeastOnce++;
          totalRevisionCount += t.revisionCount;
          if (
            (t.status === 'completed' || t.status === 'revised') &&
            (t.nextRevisionDue && (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue)))
          ) {
            dueForRevision++;
          }
          if (t.lastRevised && isToday(t.lastRevised)) {
            revisedToday++;
          }
        });
      });
    });

    const coveragePercent = totalTopics > 0 ? Math.round((revisedAtLeastOnce / totalTopics) * 100) : 0;

    return { totalTopics, completedTopics, revisedAtLeastOnce, totalRevisionCount, dueForRevision, revisedToday, coveragePercent };
  }, [subjects]);

  // Overall totals across all subjects
  const { overallTotal, overallRevised, overallPercent } = useMemo(() => {
    let total = 0;
    let revised = 0;
    subjects.forEach((s) => {
      s.chapters.forEach((c) => {
        c.topics.forEach((t) => {
          total++;
          if (t.revisionCount > 0) revised++;
        });
      });
    });
    const percent = total > 0 ? Math.round((revised / total) * 100) : 0;
    return { overallTotal: total, overallRevised: revised, overallPercent: percent };
  }, [subjects]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Stat cards — 3 clean cards without duplicate coverage percentage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Total Topics"
          value={stats.totalTopics}
          icon={BookOpen}
          color="#6366f1"
          subtitle={`${stats.completedTopics} completed`}
          isLoading={isLoading}
        />
        <StatCard
          title="Revised Today"
          value={stats.revisedToday}
          icon={Flame}
          color="#f97316"
          subtitle={stats.revisedToday > 0 ? 'Keep it up! 🔥' : 'Start revising!'}
          isLoading={isLoading}
        />
        <StatCard
          title="Due for Revision"
          value={stats.dueForRevision}
          icon={Calendar}
          color={stats.dueForRevision > 0 ? '#ef4444' : '#22c55e'}
          subtitle={stats.dueForRevision > 0 ? 'Topics need attention' : 'All caught up!'}
          isLoading={isLoading}
        />
      </div>

      {/* Redesigned Revision Coverage Card — Sleek macro overview without redundant per-subject list */}
      {isLoading ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4" role="status" aria-busy="true">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-full" />
          <span className="sr-only">Loading revision coverage</span>
        </div>
      ) : subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="text-base font-semibold">Revision Coverage</h3>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                  {overallPercent}%
                </span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3.5">
                Overall progress across all subjects in your curriculum · {overallRevised} of {overallTotal} topics revised at least once
              </p>
              <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden max-w-2xl">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPercent}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 shrink-0 pl-5 border-l border-[hsl(var(--border))]/50">
              <ProgressRing
                value={overallPercent}
                size={56}
                strokeWidth={5}
                color="#6366f1"
                sublabel="overall"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
