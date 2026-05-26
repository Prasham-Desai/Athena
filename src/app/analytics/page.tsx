'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { format, subDays, parseISO, isAfter } from 'date-fns';
import { Clock, BookOpen, RotateCcw, TrendingUp, BarChart3 } from 'lucide-react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useActivityStore } from '@/store/activity-store';
import { useHydration } from '@/hooks/use-hydration';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/shared/stat-card';
import { PageHeader } from '@/components/shared/page-header';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TimeRange = 'weekly' | 'monthly';

const CHART_THEME = {
  grid: 'hsl(var(--border))',
  text: 'hsl(var(--muted-foreground))',
  gradientStart: '#6366f1',
  gradientEnd: '#8b5cf6',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysForRange(range: TimeRange): number {
  return range === 'weekly' ? 7 : 30;
}

function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-xl text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[hsl(var(--muted-foreground))]">{p.name}:</span>
          <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const hydrated = useHydration();
  const subjects = useSubjectsStore((s) => s.subjects);
  const { dailyLogs } = useActivityStore();

  const [range, setRange] = useState<TimeRange>('weekly');

  const days = getDaysForRange(range);
  const dateRange = useMemo(() => buildDateRange(days), [days]);
  const cutoff = useMemo(() => subDays(new Date(), days), [days]);

  // Map dailyLogs by date for quick lookup
  const logsByDate = useMemo(() => {
    const map: Record<string, (typeof dailyLogs)[0]> = {};
    dailyLogs.forEach((l) => {
      map[l.date] = l;
    });
    return map;
  }, [dailyLogs]);

  // Filtered logs within range
  const logsInRange = useMemo(
    () => dailyLogs.filter((l) => isAfter(parseISO(l.date), cutoff)),
    [dailyLogs, cutoff],
  );

  // ---- Stat computations ----
  const totalStudyHours = useMemo(
    () => logsInRange.reduce((sum, l) => sum + l.studyMinutes, 0) / 60,
    [logsInRange],
  );

  const topicsCompleted = useMemo(
    () => logsInRange.reduce((sum, l) => sum + l.topicsCompleted, 0),
    [logsInRange],
  );

  const revisionsDone = useMemo(
    () => logsInRange.reduce((sum, l) => sum + l.revisionsCompleted, 0),
    [logsInRange],
  );

  const avgDailyHours = useMemo(
    () => (days > 0 ? totalStudyHours / days : 0),
    [totalStudyHours, days],
  );

  // ---- Chart 1: Study Hours Trend ----
  const studyHoursData = useMemo(
    () =>
      dateRange.map((date) => ({
        date: format(parseISO(date), 'MMM d'),
        hours: (logsByDate[date]?.studyMinutes ?? 0) / 60,
      })),
    [dateRange, logsByDate],
  );

  // ---- Chart 2: Subject Comparison ----
  const subjectData = useMemo(() => {
    return subjects.map((s) => {
      const totalTopics = s.chapters.reduce((sum, c) => sum + c.topics.length, 0);
      const completedTopics = s.chapters.reduce(
        (sum, c) =>
          sum + c.topics.filter((t) => t.status === 'completed' || t.status === 'revised').length,
        0,
      );
      return {
        name: s.name,
        completion: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        color: s.color,
      };
    });
  }, [subjects]);

  // ---- Chart 3: Daily Activity ----
  const dailyActivityData = useMemo(
    () =>
      dateRange.map((date) => {
        const log = logsByDate[date];
        return {
          date: format(parseISO(date), 'MMM d'),
          Topics: log?.topicsCompleted ?? 0,
          Tasks: log?.tasksCompleted ?? 0,
          Revisions: log?.revisionsCompleted ?? 0,
        };
      }),
    [dateRange, logsByDate],
  );

  // Loading skeleton
  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[hsl(var(--muted))]" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-[hsl(var(--muted))]" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Analytics" description="Your progress is inspiring — look how far you've come! 📈">
        {/* Time range toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-[hsl(var(--muted))] p-1">
          {(['weekly', 'monthly'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-all',
                range === r
                  ? 'bg-[hsl(var(--card))] shadow-sm text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Total Study Hours" value={totalStudyHours.toFixed(1)} icon={Clock} color="#6366f1" />
        <StatCard title="Topics Completed" value={topicsCompleted} icon={BookOpen} color="#22c55e" />
        <StatCard title="Revisions Done" value={revisionsDone} icon={RotateCcw} color="#8b5cf6" />
        <StatCard title="Avg Daily Hours" value={avgDailyHours.toFixed(1)} icon={TrendingUp} color="#f59e0b" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1 — Study Hours Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold">Study Hours Trend</h3>
          </div>
          <div className="h-48 sm:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyHoursData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#studyGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 2 — Subject Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Subject Completion</h3>
          </div>
          <div className="h-48 sm:h-56 lg:h-64">
            {subjectData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
                No subjects added yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="completion" name="Completion %" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {subjectData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Chart 3 — Daily Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-semibold">Daily Activity</h3>
          </div>
          <div className="h-48 sm:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Topics" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Tasks" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Revisions" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </>
  );
}
