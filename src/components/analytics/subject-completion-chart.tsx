'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, CheckCircle2, ListFilter, LayoutGrid } from 'lucide-react';
import type { SubjectAnalyticsSummary } from '@/lib/analytics-calculations';
import { cn } from '@/lib/utils';

interface SubjectCompletionChartProps {
  summaries: SubjectAnalyticsSummary[];
}

function CustomBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as SubjectAnalyticsSummary;
  return (
    <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <div className="flex items-center gap-2 font-semibold text-zinc-100">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span>{data.name}</span>
      </div>
      <div className="text-zinc-300 flex items-center justify-between gap-4">
        <span className="text-zinc-400">Completion:</span>
        <span className="font-bold text-emerald-400">{data.completionPercent}%</span>
      </div>
      <div className="text-zinc-300 flex items-center justify-between gap-4">
        <span className="text-zinc-400">Completed topics:</span>
        <span>{data.completedTopics} / {data.totalTopics}</span>
      </div>
      <div className="text-zinc-300 flex items-center justify-between gap-4">
        <span className="text-zinc-400">Remaining:</span>
        <span className="text-amber-400">{data.remainingTopics} topics</span>
      </div>
    </div>
  );
}

export function SubjectCompletionChart({ summaries }: SubjectCompletionChartProps) {
  const [viewMode, setViewMode] = useState<'bars' | 'chart'>('bars');

  const chartData = summaries.map((s) => ({
    name: s.name.length > 18 ? s.name.slice(0, 16) + '...' : s.name,
    fullName: s.name,
    completion: s.completionPercent,
    completedTopics: s.completedTopics,
    totalTopics: s.totalTopics,
    remainingTopics: s.remainingTopics,
    color: s.color,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Subject Syllabus Completion
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              Unique topics completed (excluding duplicate revisions)
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
          <button
            onClick={() => setViewMode('bars')}
            className={cn(
              'rounded-lg px-2 py-1 font-medium transition-all flex items-center gap-1',
              viewMode === 'bars'
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
            title="List view with topic counts"
          >
            <ListFilter className="h-3 w-3" />
            <span className="hidden sm:inline">Details</span>
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={cn(
              'rounded-lg px-2 py-1 font-medium transition-all flex items-center gap-1',
              viewMode === 'chart'
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
            title="Visual bar chart"
          >
            <LayoutGrid className="h-3 w-3" />
            <span className="hidden sm:inline">Chart</span>
          </button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
          No syllabus subjects available.
        </div>
      ) : viewMode === 'bars' ? (
        /* Rich Detailed Progress Bars */
        <div className="space-y-3.5">
          {summaries.map((s) => (
            <div key={s.subjectId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[hsl(var(--foreground))] truncate flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                    {s.completedTopics} / {s.totalTopics}
                    <span className="text-[10px] text-zinc-500 ml-1">
                      ({s.remainingTopics} left)
                    </span>
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                    style={{
                      backgroundColor: `${s.color}18`,
                      color: s.color,
                    }}
                  >
                    {s.completionPercent}%
                  </span>
                </div>
              </div>

              {/* Progress bar track */}
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${s.completionPercent}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Recharts Vertical Bar Chart */
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="completion" name="Completion %" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
