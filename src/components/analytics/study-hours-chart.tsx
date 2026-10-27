'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import {
  format,
  parseISO,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import type { DailyLog } from '@/types';
import type { AggregationPeriod } from '@/lib/analytics-calculations';
import { cn } from '@/lib/utils';

interface StudyHoursChartProps {
  dailyLogs: DailyLog[];
  startDateStr: string;
  endDateStr: string;
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-md px-3.5 py-2 shadow-xl text-xs space-y-1">
      <div className="font-semibold text-[hsl(var(--foreground))]">{label}</div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-indigo-500" />
        <span className="text-[hsl(var(--muted-foreground))]">Study Time:</span>
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          {h > 0 ? `${h}h ${m}m` : `${m}m`} ({value.toFixed(1)} hrs)
        </span>
      </div>
    </div>
  );
}

export function StudyHoursChart({
  dailyLogs,
  startDateStr,
  endDateStr,
}: StudyHoursChartProps) {
  const [period, setPeriod] = useState<AggregationPeriod>('daily');

  // Logs Map for fast lookup
  const logsMap = useMemo(() => {
    const map = new Map<string, number>();
    dailyLogs.forEach((l) => map.set(l.date, l.studyMinutes));
    return map;
  }, [dailyLogs]);

  // Generate chart data points based on selected aggregation period
  const chartData = useMemo(() => {
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return [];
      }

      if (period === 'daily') {
        const days = eachDayOfInterval({ start, end });
        return days.map((d) => {
          const dStr = format(d, 'yyyy-MM-dd');
          const mins = logsMap.get(dStr) || 0;
          return {
            dateKey: dStr,
            label: format(d, 'MMM d'),
            hours: Number((mins / 60).toFixed(2)),
          };
        });
      }

      if (period === 'weekly') {
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        return weeks.map((wStart) => {
          const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
          const weekDays = eachDayOfInterval({
            start: wStart < start ? start : wStart,
            end: wEnd > end ? end : wEnd,
          });

          let weekMins = 0;
          weekDays.forEach((d) => {
            const dStr = format(d, 'yyyy-MM-dd');
            weekMins += logsMap.get(dStr) || 0;
          });

          return {
            dateKey: format(wStart, 'yyyy-MM-dd'),
            label: `Wk ${format(wStart, 'w (MMM d)')}`,
            hours: Number((weekMins / 60).toFixed(2)),
          };
        });
      }

      if (period === 'monthly') {
        const months = eachMonthOfInterval({ start, end });
        return months.map((mStart) => {
          const mEnd = endOfMonth(mStart);
          const monthDays = eachDayOfInterval({
            start: mStart < start ? start : mStart,
            end: mEnd > end ? end : mEnd,
          });

          let monthMins = 0;
          monthDays.forEach((d) => {
            const dStr = format(d, 'yyyy-MM-dd');
            monthMins += logsMap.get(dStr) || 0;
          });

          return {
            dateKey: format(mStart, 'yyyy-MM'),
            label: format(mStart, 'MMM yyyy'),
            hours: Number((monthMins / 60).toFixed(2)),
          };
        });
      }

      return [];
    } catch {
      return [];
    }
  }, [startDateStr, endDateStr, period, logsMap]);

  const maxHours = useMemo(() => {
    if (!chartData.length) return 4;
    const maxVal = Math.max(...chartData.map((d) => d.hours));
    return maxVal > 0 ? Math.ceil(maxVal * 1.15) : 4;
  }, [chartData]);

  const totalPeriodHours = useMemo(() => {
    return Number(chartData.reduce((acc, d) => acc + d.hours, 0).toFixed(1));
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
              Study Hours Trend
            </h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              {totalPeriodHours} hrs total in selected range
            </p>
          </div>
        </div>

        {/* Aggregation Toggle */}
        <div className="flex items-center rounded-xl bg-[hsl(var(--muted))] p-1 text-xs self-start sm:self-auto">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium capitalize transition-all',
                period === p
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 sm:h-64">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
            No study records in this interval
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="studyTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                minTickGap={18}
              />
              <YAxis
                domain={[0, maxHours]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                unit="h"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="hours"
                name="Study Hours"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#studyTrendGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
