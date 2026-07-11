'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  RotateCcw,
  TrendingUp,
  Target,
  Flame,
  Calendar,
} from 'lucide-react';

import { StatCard } from '@/components/shared/stat-card';
import { ProgressRing } from '@/components/shared/progress-ring';
import type { Subject } from '@/types';
import { isOverdue, isToday, getToday } from '@/lib/utils';

interface RevisionStatsHeaderProps {
  subjects: Subject[];
}

export function RevisionStatsHeader({ subjects }: RevisionStatsHeaderProps) {
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

  // Per-subject revision analysis
  const subjectAnalysis = useMemo(() => {
    return subjects.map((s) => {
      const allTopics = s.chapters.flatMap((c) => c.topics);
      const total = allTopics.length;
      const revised = allTopics.filter((t) => t.revisionCount > 0).length;
      const revisionPercent = total > 0 ? Math.round((revised / total) * 100) : 0;
      return { id: s.id, name: s.name, color: s.color, total, revised, revisionPercent };
    });
  }, [subjects]);

  const overallRevised = subjectAnalysis.reduce((s, a) => s + a.revised, 0);
  const overallTotal = subjectAnalysis.reduce((s, a) => s + a.total, 0);
  const overallPercent = overallTotal > 0 ? Math.round((overallRevised / overallTotal) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Topics"
          value={stats.totalTopics}
          icon={BookOpen}
          color="#6366f1"
          subtitle={`${stats.completedTopics} completed`}
        />
        <StatCard
          title="Revised Today"
          value={stats.revisedToday}
          icon={Flame}
          color="#f97316"
          subtitle={stats.revisedToday > 0 ? 'Keep it up! 🔥' : 'Start revising!'}
        />
        <StatCard
          title="Due for Revision"
          value={stats.dueForRevision}
          icon={Calendar}
          color={stats.dueForRevision > 0 ? '#ef4444' : '#22c55e'}
          subtitle={stats.dueForRevision > 0 ? 'Topics need attention' : 'All caught up!'}
        />
        <StatCard
          title="Coverage"
          value={`${stats.coveragePercent}%`}
          icon={Target}
          color="#8b5cf6"
          subtitle={`${stats.revisedAtLeastOnce} of ${stats.totalTopics} revised`}
        />
      </div>

      {/* Revision Completion Analysis Card */}
      {subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 sm:p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold">Revision Coverage</h3>
            <div className="hidden sm:block">
              <ProgressRing
                value={overallPercent}
                size={56}
                strokeWidth={5}
                color="#6366f1"
                sublabel="overall"
              />
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5">
            How much of each subject has been revised at least once
          </p>

          {/* Overall bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Overall Coverage</span>
              <span className="text-xs font-bold text-indigo-400">{overallPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
              {overallRevised} of {overallTotal} topics revised at least once
            </p>
          </div>

          {/* Per-subject breakdown */}
          <div className="space-y-3">
            {subjectAnalysis.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-xs font-medium flex-1 min-w-0 truncate">{item.name}</span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">
                  {item.revised}/{item.total}
                </span>
                <div className="w-16 sm:w-24 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden shrink-0">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.revisionPercent}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-bold w-8 text-right shrink-0" style={{ color: item.color }}>
                  {item.revisionPercent}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
