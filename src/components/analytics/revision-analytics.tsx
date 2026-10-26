'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCheck, RefreshCw, AlertCircle } from 'lucide-react';
import type { SubjectAnalyticsSummary } from '@/lib/analytics-calculations';

interface RevisionAnalyticsProps {
  summaries: SubjectAnalyticsSummary[];
  totalRevisionsCount: number;
}

export function RevisionAnalytics({ summaries, totalRevisionsCount }: RevisionAnalyticsProps) {
  const totalRevisedTopics = useMemo(() => {
    return summaries.reduce((acc, s) => acc + s.revisedTopics, 0);
  }, [summaries]);

  const totalTopicsOverall = useMemo(() => {
    return summaries.reduce((acc, s) => acc + s.totalTopics, 0);
  }, [summaries]);

  const overallRevisionCoverage =
    totalTopicsOverall > 0 ? Math.round((totalRevisedTopics / totalTopicsOverall) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Revision Intelligence
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Active recall frequency and syllabus revision depth
            </p>
          </div>
        </div>
        <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
          {totalRevisionsCount} Revisions Done
        </span>
      </div>

      {/* Header Metric Pills */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <CheckCheck className="h-3.5 w-3.5 text-purple-400" />
            Revised Topics
          </div>
          <div className="text-base font-bold text-[hsl(var(--foreground))] mt-1">
            {totalRevisedTopics} / {totalTopicsOverall}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Unique topics revised</div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            Revision Coverage
          </div>
          <div className="text-base font-bold text-[hsl(var(--foreground))] mt-1">
            {overallRevisionCoverage}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Of full syllabus covered</div>
        </div>
      </div>

      {/* Subject Revision Coverage Breakdown */}
      <div className="space-y-3">
        <div className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
          Subject-Wise Revision Coverage
        </div>
        {summaries.map((s) => (
          <div key={s.subjectId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--foreground))] font-medium truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">
                {s.revisedTopics} / {s.totalTopics} ({s.revisionCoveragePercent}%)
              </span>
            </div>
            <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${s.revisionCoveragePercent}%`,
                  backgroundColor: s.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
