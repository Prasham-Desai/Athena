'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import type { DailyLog } from '@/types';

interface DailyActivityChartProps {
  dailyLogs: DailyLog[];
  startDateStr: string;
  endDateStr: string;
}

function CustomActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1.5">
      <div className="font-semibold text-zinc-100">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-zinc-400">{p.name}:</span>
          </div>
          <span className="font-semibold text-zinc-200">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DailyActivityChart({
  dailyLogs,
  startDateStr,
  endDateStr,
}: DailyActivityChartProps) {
  const logsMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    dailyLogs.forEach((l) => map.set(l.date, l));
    return map;
  }, [dailyLogs]);

  const chartData = useMemo(() => {
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

      const days = eachDayOfInterval({ start, end });
      return days.map((d) => {
        const dStr = format(d, 'yyyy-MM-dd');
        const log = logsMap.get(dStr);
        return {
          date: format(d, 'MMM d'),
          Topics: log?.topicsCompleted || 0,
          Tasks: log?.tasksCompleted || 0,
          Revisions: log?.revisionsCompleted || 0,
        };
      });
    } catch {
      return [];
    }
  }, [startDateStr, endDateStr, logsMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Daily Academic Activity
          </h3>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            Topics completed, tasks finished, and revisions conducted
          </p>
        </div>
      </div>

      <div className="h-56 sm:h-64">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
            No activity records in this interval
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomActivityTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={7}
              />
              <Bar dataKey="Topics" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Tasks" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Revisions" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
