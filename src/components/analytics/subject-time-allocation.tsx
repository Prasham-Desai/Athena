'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Clock, Layers } from 'lucide-react';
import type { SubjectAnalyticsSummary } from '@/lib/analytics-calculations';
import { cn } from '@/lib/utils';

interface SubjectTimeAllocationProps {
  summaries: SubjectAnalyticsSummary[];
}

export function SubjectTimeAllocation({ summaries }: SubjectTimeAllocationProps) {
  // Sort subjects by study hours descending
  const sorted = useMemo(() => {
    return [...summaries].sort((a, b) => b.studyMinutes - a.studyMinutes);
  }, [summaries]);

  const totalCurriculumHours = useMemo(() => {
    const mins = summaries.reduce((acc, s) => acc + s.studyMinutes, 0);
    return Number((mins / 60).toFixed(1));
  }, [summaries]);

  const hasData = totalCurriculumHours > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Subject Time Allocation
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Study duration distributed across syllabus subjects
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
          {totalCurriculumHours} total hrs
        </span>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          No subject-attributed study sessions recorded yet. Study blocks and timer sessions linked to subjects will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Segmented Stacked Bar */}
          <div className="w-full h-3 rounded-full bg-[hsl(var(--muted))] flex overflow-hidden">
            {sorted.map((s) => {
              if (s.timeSharePercent <= 0) return null;
              return (
                <div
                  key={s.subjectId}
                  title={`${s.name}: ${s.studyHours}h (${s.timeSharePercent}%)`}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${s.timeSharePercent}%`,
                    backgroundColor: s.color,
                  }}
                />
              );
            })}
          </div>

          {/* List of subjects with bars */}
          <div className="space-y-2.5">
            {sorted.map((s) => (
              <div key={s.subjectId} className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[hsl(var(--foreground))] font-medium truncate">
                    {s.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[hsl(var(--muted-foreground))] font-mono text-[11px]">
                    {s.studyHours} hrs
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${s.color}15`,
                      color: s.color,
                    }}
                  >
                    {s.timeSharePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
