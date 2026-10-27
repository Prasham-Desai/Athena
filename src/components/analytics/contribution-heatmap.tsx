'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  RotateCcw,
  Flame,
  Trophy,
  Calendar,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DailyLog, Subject, StudyBlock } from '@/types';
import { getSubjectDisplayName } from '@/lib/subject-display';
import {
  generateHeatmapGrid,
  calculateStreaks,
  CalendarDayCell,
  HeatmapMetric,
} from '@/lib/analytics-calculations';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContributionHeatmapProps {
  dailyLogs: DailyLog[];
  subjects: Subject[];
  studyBlocks?: StudyBlock[];
  dailyGoalHours?: number;
  onSelectDate: (date: string) => void;
  selectedDate?: string | null;
}

// ---------------------------------------------------------------------------
// Cell Color Mapper (GitHub Dark Palette)
// ---------------------------------------------------------------------------

function getCellColorClass(cell: CalendarDayCell | null): {
  bg: string;
  border: string;
  glow?: string;
} {
  if (!cell) {
    return { bg: 'transparent', border: 'transparent' };
  }

  if (cell.isFuture) {
    return {
      bg: 'bg-[#0d1117]/40',
      border: 'border-dashed border-white/[0.05]',
    };
  }

  switch (cell.intensity) {
    case 1:
      return {
        bg: 'bg-[#0e4429]',
        border: 'border-[#006d32]/30',
        glow: 'hover:shadow-[0_0_8px_rgba(14,68,41,0.6)]',
      };
    case 2:
      return {
        bg: 'bg-[#006d32]',
        border: 'border-[#26a641]/30',
        glow: 'hover:shadow-[0_0_10px_rgba(0,109,50,0.7)]',
      };
    case 3:
      return {
        bg: 'bg-[#26a641]',
        border: 'border-[#39d353]/40',
        glow: 'hover:shadow-[0_0_12px_rgba(38,166,65,0.8)]',
      };
    case 4:
      return {
        bg: 'bg-[#39d353]',
        border: 'border-[#7ee787]/50',
        glow: 'hover:shadow-[0_0_14px_rgba(57,211,83,0.9)]',
      };
    case 0:
    default:
      return {
        bg: 'bg-[#161b22]',
        border: 'border-white/[0.04]',
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContributionHeatmap({
  dailyLogs,
  subjects,
  studyBlocks = [],
  dailyGoalHours = 6,
  onSelectDate,
  selectedDate,
}: ContributionHeatmapProps) {
  const currentSystemYear = new Date().getFullYear();

  // Find all available years from dailyLogs and current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentSystemYear);
    dailyLogs.forEach((l) => {
      const yr = parseInt(l.date.slice(0, 4), 10);
      if (!isNaN(yr)) yearsSet.add(yr);
    });
    studyBlocks.forEach((b) => {
      const yr = parseInt(b.date.slice(0, 4), 10);
      if (!isNaN(yr)) yearsSet.add(yr);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [dailyLogs, studyBlocks, currentSystemYear]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || currentSystemYear);
  const [metric, setMetric] = useState<HeatmapMetric>('hours');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Tooltip State
  const [hoveredCell, setHoveredCell] = useState<CalendarDayCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate Calendar Grid
  const grid = useMemo(() => {
    return generateHeatmapGrid({
      year: selectedYear,
      dailyLogs,
      metric,
      filterSubjectId: selectedSubjectId === 'all' ? undefined : selectedSubjectId,
      subjects,
      studyBlocks,
    });
  }, [selectedYear, dailyLogs, metric, selectedSubjectId, subjects, studyBlocks]);

  // Year Streaks & Summaries
  const yearStats = useMemo(() => {
    const activeDatesInYear = dailyLogs
      .filter((l) => {
        const yr = parseInt(l.date.slice(0, 4), 10);
        return yr === selectedYear && (l.studyMinutes > 0 || l.topicsCompleted > 0 || l.revisionsCompleted > 0);
      })
      .map((l) => l.date);

    const streaks = calculateStreaks(activeDatesInYear);

    // Most productive day in the selected year
    let bestDay: { date: string; hours: number; sessions: number } | null = null;
    dailyLogs.forEach((l) => {
      const yr = parseInt(l.date.slice(0, 4), 10);
      if (yr === selectedYear && l.studyMinutes > 0) {
        const hrs = l.studyMinutes / 60;
        if (!bestDay || hrs > bestDay.hours) {
          bestDay = {
            date: l.date,
            hours: Number(hrs.toFixed(1)),
            sessions: l.sessions?.length || 1,
          };
        }
      }
    });

    const avgDurationPerActiveDay =
      grid.activeDaysCount > 0 ? (grid.totalHours / grid.activeDaysCount).toFixed(1) : '0.0';

    return {
      ...streaks,
      avgDurationPerActiveDay,
      mostProductiveDay: bestDay,
    };
  }, [dailyLogs, selectedYear, grid]);

  // Handle cell mouse enter for tooltip
  const handleCellMouseEnter = (cell: CalendarDayCell, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      // Calculate relative position to container
      const relativeX = rect.left - containerRect.left + rect.width / 2;
      const relativeY = rect.top - containerRect.top;
      setTooltipPos({ x: relativeX, y: relativeY });
    }
    setHoveredCell(cell);
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
    setTooltipPos(null);
  };

  const handlePrevYear = () => {
    const prevYear = selectedYear - 1;
    setSelectedYear(prevYear);
  };

  const handleNextYear = () => {
    const nextYear = selectedYear + 1;
    setSelectedYear(nextYear);
  };

  const weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div
      ref={containerRef}
      className="relative max-w-full overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6 shadow-sm"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header Controls */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))]">
              Study Contribution Heatmap
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              {grid.activeDaysCount} active days in {selectedYear}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            GitHub-style yearly visualization of study duration, completions, and revision habits.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Metric Selector */}
          <div className="flex items-center rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
            <button
              onClick={() => setMetric('hours')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-all flex items-center gap-1.5',
                metric === 'hours'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <Clock className="h-3 w-3" />
              Hours
            </button>
            <button
              onClick={() => setMetric('topics')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-all flex items-center gap-1.5',
                metric === 'topics'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <BookOpen className="h-3 w-3" />
              Topics
            </button>
            <button
              onClick={() => setMetric('revisions')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-all flex items-center gap-1.5',
                metric === 'revisions'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <RotateCcw className="h-3 w-3" />
              Revisions
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="relative flex items-center">
            <Filter className="absolute left-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] pointer-events-none" />
            <select
              aria-label="Filter heatmap by subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {getSubjectDisplayName(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Year Navigator */}
          <div className="flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-0.5">
            <button
              onClick={handlePrevYear}
              className="p-1 rounded-lg hover:bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              title="Previous year"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              aria-label="Select year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent px-2 text-xs font-semibold text-[hsl(var(--foreground))] focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                  {yr}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextYear}
              className="p-1 rounded-lg hover:bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              title="Next year"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Heatmap Grid & Headers */}
      {/* ------------------------------------------------------------------ */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        <div className="min-w-[760px] select-none">
          {/* Month Header Row */}
          <div className="mb-1.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))] h-4 relative">
            {grid.monthHeaders.map((mh, idx) => {
              // Week column starts after weekday labels (w-6 = 24px + gap-2 = 8px => 32px)
              // Each cell is 12px + 3px gap = 15px
              const leftOffset = 32 + mh.weekColumn * 15;
              return (
                <span
                  key={idx}
                  className="absolute transform text-[10px] tracking-wide uppercase text-zinc-400 font-semibold"
                  style={{ left: `${leftOffset}px` }}
                >
                  {mh.shortName}
                </span>
              );
            })}
          </div>

          {/* Calendar Grid with Weekday Labels on Left */}
          <div className="flex items-start gap-2">
            {/* Weekday labels */}
            <div className="flex flex-col gap-[3px] text-[10px] font-medium text-zinc-500 w-6 pt-[1px] text-right pr-1">
              {weekdays.map((wd, idx) => (
                <div key={idx} className="h-3 leading-3 flex items-center justify-end">
                  {wd}
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px]">
              {grid.columns.map((column, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px]">
                  {column.map((cell, rowIdx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${colIdx}-${rowIdx}`}
                          className="w-3 h-3 rounded-[2.5px] bg-transparent"
                        />
                      );
                    }

                    const colors = getCellColorClass(cell);
                    const isSelected = selectedDate === cell.date;

                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => onSelectDate(cell.date)}
                        onMouseEnter={(e) => handleCellMouseEnter(cell, e)}
                        onMouseLeave={handleCellMouseLeave}
                        aria-label={`Date: ${cell.date}, Intensity: ${cell.intensity}`}
                        className={cn(
                          'w-3 h-3 rounded-[2.5px] border transition-all duration-150 relative cursor-pointer',
                          colors.bg,
                          colors.border,
                          colors.glow,
                          isSelected && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-[hsl(var(--card))] scale-125 z-10',
                          'hover:scale-125 hover:z-20'
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Heatmap Legend & Summary Footer */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
        {/* Metric info */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[hsl(var(--foreground))]">
            {metric === 'hours' && 'Study Duration scale:'}
            {metric === 'topics' && 'Topics Completed scale:'}
            {metric === 'revisions' && 'Revisions Completed scale:'}
          </span>
          <span className="text-[11px] text-zinc-400">
            {metric === 'hours' && '0h • <1h • 1-2.5h • 2.5-4.5h • 4.5h+'}
            {metric === 'topics' && '0 • 1 • 2-3 • 4-6 • 7+ topics'}
            {metric === 'revisions' && '0 • 1 • 2 • 3-4 • 5+ revisions'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] text-zinc-400 mr-1">Less</span>
          <div className="w-3 h-3 rounded-[2.5px] bg-[#161b22] border border-white/[0.04]" title="0" />
          <div className="w-3 h-3 rounded-[2.5px] bg-[#0e4429] border border-[#006d32]/30" title="Low" />
          <div className="w-3 h-3 rounded-[2.5px] bg-[#006d32] border border-[#26a641]/30" title="Medium" />
          <div className="w-3 h-3 rounded-[2.5px] bg-[#26a641] border border-[#39d353]/40" title="High" />
          <div className="w-3 h-3 rounded-[2.5px] bg-[#39d353] border border-[#7ee787]/50" title="Very high" />
          <span className="text-[11px] text-zinc-400 ml-1">More</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Annual Summary Metrics Bar */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 border-t border-[hsl(var(--border))]/60">
        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Clock className="h-3 w-3 text-indigo-400" />
            Total Hours
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {grid.totalHours} <span className="text-[11px] font-normal text-zinc-400">hrs</span>
          </div>
        </div>

        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Calendar className="h-3 w-3 text-emerald-400" />
            Active Days
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {grid.activeDaysCount} <span className="text-[11px] font-normal text-zinc-400">days</span>
          </div>
        </div>

        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-cyan-400" />
            Topics
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {grid.totalTopics}
          </div>
        </div>

        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-purple-400" />
            Revisions
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {grid.totalRevisions}
          </div>
        </div>

        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Avg/Active Day
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {yearStats.avgDurationPerActiveDay} <span className="text-[11px] font-normal text-zinc-400">h</span>
          </div>
        </div>

        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-400" />
            Current Streak
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {yearStats.currentStreak} <span className="text-[11px] font-normal text-zinc-400">days</span>
          </div>
        </div>

        <div className="rounded-xl bg-[hsl(var(--muted))]/50 p-2.5 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Trophy className="h-3 w-3 text-yellow-400" />
            Longest Streak
          </div>
          <div className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))] mt-0.5">
            {yearStats.longestStreak} <span className="text-[11px] font-normal text-zinc-400">days</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Interactive Floating Tooltip */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {hoveredCell && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 pointer-events-none rounded-xl border border-zinc-700/80 bg-zinc-950/95 backdrop-blur-md px-3.5 py-2.5 shadow-2xl text-xs w-64 max-w-[90vw]"
            style={{
              left: `${Math.min(
                Math.max(130, tooltipPos.x),
                (containerRef.current?.clientWidth || 700) - 140
              )}px`,
              top: `${Math.max(10, tooltipPos.y - 125)}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Date and Day */}
            <div className="font-semibold text-zinc-100 flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
              <span>{format(parseISO(hoveredCell.date), 'EEEE, MMMM d, yyyy')}</span>
              {hoveredCell.isFuture && (
                <span className="text-[10px] text-zinc-500 font-normal">Future</span>
              )}
            </div>

            {/* Study Duration */}
            <div className="flex items-center justify-between text-zinc-300 mb-1">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Study Duration:
              </span>
              <span className="font-bold text-emerald-400">
                {hoveredCell.studyMinutes > 0
                  ? `${Math.floor(hoveredCell.studyMinutes / 60)}h ${hoveredCell.studyMinutes % 60}m`
                  : '0m (No activity)'}
              </span>
            </div>

            {/* Sessions count */}
            {hoveredCell.sessionsCount > 0 && (
              <div className="flex items-center justify-between text-zinc-300 mb-1">
                <span className="text-zinc-400">Sessions recorded:</span>
                <span className="font-medium text-zinc-200">{hoveredCell.sessionsCount}</span>
              </div>
            )}

            {/* Topics & Revisions */}
            {(hoveredCell.topicsCompleted > 0 || hoveredCell.revisionsCompleted > 0) && (
              <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-t border-zinc-800/80 my-1">
                <div className="flex items-center gap-1 text-cyan-300">
                  <BookOpen className="h-3 w-3" />
                  <span>{hoveredCell.topicsCompleted} topics</span>
                </div>
                <div className="flex items-center gap-1 text-purple-300">
                  <RotateCcw className="h-3 w-3" />
                  <span>{hoveredCell.revisionsCompleted} revisions</span>
                </div>
              </div>
            )}

            {/* Subjects Studied */}
            {hoveredCell.subjectsStudied.length > 0 && (
              <div className="mt-1 pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400 truncate">
                Subjects: <span className="text-zinc-200">{hoveredCell.subjectsStudied.join(', ')}</span>
              </div>
            )}

            {/* Daily Goal Progress Bar */}
            {dailyGoalHours > 0 && !hoveredCell.isFuture && (
              <div className="mt-2 pt-1.5 border-t border-zinc-800">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Daily Goal ({dailyGoalHours}h)</span>
                  <span className="font-semibold text-zinc-200">
                    {Math.round((hoveredCell.studyHours / dailyGoalHours) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      hoveredCell.studyHours >= dailyGoalHours ? 'bg-emerald-400' : 'bg-indigo-500'
                    )}
                    style={{
                      width: `${Math.min(100, Math.round((hoveredCell.studyHours / dailyGoalHours) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="text-[9px] text-zinc-500 text-center mt-2">
              Click date to view detailed session log
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
