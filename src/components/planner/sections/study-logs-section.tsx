'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Clock,
  Play,
  Edit2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Link2,
  Timer,
  CheckSquare,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday as isDateToday,
} from 'date-fns';

import { cn, formatDate, getRelativeDate, PRIORITY_CONFIG } from '@/lib/utils';
import { formatDurationHuman, calculateMinutesFromRange } from '@/lib/study-analytics';
import type { StudyBlock, Task, DailyLog } from '@/types';
import type { ActiveTimerTarget } from '@/store/timer-store';
import { Skeleton } from '@/components/ui/loading';

interface StudyLogsSectionProps {
  studyBlocks: StudyBlock[];
  tasks: Task[];
  subjects: { id: string; name: string; color: string }[];
  dailyLogs?: DailyLog[];
  isLoading?: boolean;
  todayStr: string;
  onOpenLogModal: () => void;
  onEditBlock: (block: StudyBlock) => void;
  onDeleteBlock: (id: string) => void;
  onDeleteSession?: (date: string, sessionId: string) => void;
  onStartFocus: (target: ActiveTimerTarget) => void;
}

export function StudyLogsSection({
  studyBlocks,
  tasks,
  subjects,
  dailyLogs = [],
  isLoading = false,
  todayStr,
  onOpenLogModal,
  onEditBlock,
  onDeleteBlock,
  onDeleteSession,
  onStartFocus,
}: StudyLogsSectionProps) {
  // Calendar and date selection state
  const initialDate = useMemo(() => {
    // If today has logs, default to today. Otherwise, if there are blocks, we can still default to today but calendar lets user click any dot!
    return new Date(todayStr + 'T00:00:00');
  }, [todayStr]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewMonth, setViewMonth] = useState<Date>(initialDate);
  const [viewMode, setViewMode] = useState<'selected' | 'all'>('selected');

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Subject and task lookup maps
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Sets for quick calendar dot lookups
  const taskDates = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      if (t.date) set.add(t.date);
    }
    return set;
  }, [tasks]);

  const studyDates = useMemo(() => {
    const set = new Set<string>();
    for (const b of studyBlocks) {
      if (b.date) set.add(b.date);
    }
    for (const l of dailyLogs) {
      if (l.sessions && l.sessions.length > 0) set.add(l.date);
    }
    return set;
  }, [studyBlocks, dailyLogs]);

  // Calendar dates computation
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Filter study blocks based on viewMode ('selected' vs 'all')
  const displayedBlocks = useMemo(() => {
    if (viewMode === 'all') {
      return [...studyBlocks].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.startTime || '').localeCompare(a.startTime || '');
      });
    }
    return studyBlocks
      .filter((b) => b.date === selectedDateStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [studyBlocks, viewMode, selectedDateStr]);

  // Additional standalone sessions from dailyLogs on this date
  const standaloneSessions = useMemo(() => {
    if (viewMode === 'all') {
      // Find sessions not already represented as study blocks
      return dailyLogs
        .flatMap((l) =>
          (l.sessions || [])
            .filter((s) => !studyBlocks.some((b) => b.id === s.id || b.id === s.taskId))
            .map((s) => ({ ...s, date: l.date }))
        )
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    const dayLog = dailyLogs.find((l) => l.date === selectedDateStr);
    if (!dayLog || !dayLog.sessions) return [];
    return dayLog.sessions
      .filter((s) => !studyBlocks.some((b) => b.id === s.id || b.id === s.taskId))
      .map((s) => ({ ...s, date: selectedDateStr }));
  }, [dailyLogs, studyBlocks, viewMode, selectedDateStr]);

  // Total duration in minutes
  const totalRecordedMinutes = useMemo(() => {
    const blockMinutes = displayedBlocks.reduce((acc, b) => {
      return acc + (b.durationMinutes ?? calculateMinutesFromRange(b.startTime, b.endTime));
    }, 0);
    const sessionMinutes = standaloneSessions.reduce((acc, s) => {
      return acc + (s.durationMinutes || 0);
    }, 0);
    return blockMinutes + sessionMinutes;
  }, [displayedBlocks, standaloneSessions]);

  const handleSelectDate = (day: Date) => {
    setSelectedDate(day);
    setViewMode('selected');
    if (!isSameMonth(day, viewMonth)) {
      setViewMonth(day);
    }
  };

  const handleJumpToday = () => {
    const today = new Date(todayStr + 'T00:00:00');
    setSelectedDate(today);
    setViewMonth(today);
    setViewMode('selected');
  };

  return (
    <section className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 shadow-sm min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[hsl(var(--border))] min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))]">Study Blocks & Logs</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold">
                {isLoading ? 'Loading' : `${studyBlocks.length} ${studyBlocks.length === 1 ? 'record' : 'records'}`}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              Interactive date selector, verified timer sessions, and study history
            </p>
          </div>
        </div>

        {/* Global Action Button */}
        <button
          type="button"
          onClick={onOpenLogModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-indigo-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Study Time</span>
        </button>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-busy="true"
          className="absolute inset-x-4 bottom-4 top-24 z-10 grid grid-cols-1 gap-4 rounded-2xl bg-[hsl(var(--card))]/90 p-2 backdrop-blur-sm lg:grid-cols-12"
        >
          <span className="sr-only">Loading study logs and calendar</span>
          <Skeleton className="h-72 rounded-2xl lg:col-span-4" />
          <Skeleton className="h-72 rounded-2xl lg:col-span-8" />
        </div>
      )}

      {/* Main 30% / 70% Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ~30% Mini Calendar Selector */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-w-0">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/60 p-4 shadow-sm min-w-0">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-xs sm:text-sm font-bold text-[hsl(var(--foreground))]">
                {format(viewMonth, 'MMMM yyyy')}
              </h3>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {dayNames.map((d) => (
                <div key={d} className="text-[10px] font-semibold uppercase text-[hsl(var(--muted-foreground))] py-0.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, viewMonth);
                const isSelected = isSameDay(day, selectedDate) && viewMode === 'selected';
                const isTodayDate = isSameDay(day, new Date(todayStr + 'T00:00:00'));
                const hasTasks = taskDates.has(dayStr);
                const hasStudy = studyDates.has(dayStr);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={cn(
                      'relative flex flex-col items-center justify-center py-2 rounded-xl text-xs transition-all min-h-[42px]',
                      !inMonth && 'opacity-30 hover:opacity-70',
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-indigo-500/25'
                        : isTodayDate
                        ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/30'
                        : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                    )}
                  >
                    <span className="leading-none">{format(day, 'd')}</span>

                    {/* Activity Indicator Dots */}
                    <div className="flex items-center gap-1 mt-1 h-1.5">
                      {hasStudy && (
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            isSelected ? 'bg-white' : 'bg-indigo-400'
                          )}
                          title="Study logs on this date"
                        />
                      )}
                      {hasTasks && (
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            isSelected ? 'bg-white' : 'bg-emerald-400'
                          )}
                          title="Tasks scheduled on this date"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend & Quick Jump */}
            <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]/60 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span>Study Logs</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Tasks</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleJumpToday}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ~70% Actual Study Logs */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-w-0">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[hsl(var(--background))]/60 border border-[hsl(var(--border))] min-w-0">
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[hsl(var(--foreground))] truncate">
                {viewMode === 'all'
                  ? 'All Study Records'
                  : format(selectedDate, 'EEEE, d MMMM yyyy')}
              </h3>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                {viewMode === 'all'
                  ? `Showing all historical and active study logs`
                  : isSameDay(selectedDate, new Date(todayStr + 'T00:00:00'))
                  ? 'Today’s study activities'
                  : 'Selected date from calendar'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Toggle Tabs */}
              <LayoutGroup id="study-logs-view-tabs">
                <div className="relative flex items-center p-1 rounded-xl bg-[hsl(var(--muted))]/80 text-xs font-medium border border-[hsl(var(--border))]/50">
                  <button
                    type="button"
                    onClick={() => setViewMode('selected')}
                    className={cn(
                      'relative z-10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150',
                      viewMode === 'selected'
                        ? 'text-[hsl(var(--foreground))]'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    )}
                  >
                    {viewMode === 'selected' && (
                      <motion.div
                        layoutId="study-logs-view-pill"
                        className="absolute inset-0 bg-[hsl(var(--card))] rounded-lg shadow-sm border border-[hsl(var(--border))]/50"
                        transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                      />
                    )}
                    <span className="relative z-10">Selected Date</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={cn(
                      'relative z-10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150',
                      viewMode === 'all'
                        ? 'text-[hsl(var(--foreground))]'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    )}
                  >
                    {viewMode === 'all' && (
                      <motion.div
                        layoutId="study-logs-view-pill"
                        className="absolute inset-0 bg-[hsl(var(--card))] rounded-lg shadow-sm border border-[hsl(var(--border))]/50"
                        transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                      />
                    )}
                    <span className="relative z-10">All Dates ({studyBlocks.length})</span>
                  </button>
                </div>
              </LayoutGroup>

              {/* Total Duration Pill */}
              <div className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg shrink-0">
                Total: {formatDurationHuman(totalRecordedMinutes)}
              </div>
            </div>
          </div>

          {/* Records List */}
          {displayedBlocks.length === 0 && standaloneSessions.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 p-6 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-3 text-[hsl(var(--muted-foreground))]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[hsl(var(--foreground))]">
                {viewMode === 'all'
                  ? 'No study time logged yet'
                  : `No study logs for ${format(selectedDate, 'MMM d, yyyy')}`}
              </h4>
              <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mt-1">
                {studyBlocks.length > 0 && viewMode === 'selected'
                  ? `You have ${studyBlocks.length} study ${studyBlocks.length === 1 ? 'log' : 'logs'} on other dates. Click any date with a dot on the calendar or view all.`
                  : 'Add a retrospective study log if you studied without starting the timer, or focus on a topic now.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {studyBlocks.length > 0 && viewMode === 'selected' && (
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/25 text-xs font-semibold transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View All {studyBlocks.length} Logs</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenLogModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-indigo-500/20 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Study Time</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 min-w-0">
              <AnimatePresence>
                {/* 1. Study Blocks */}
                {displayedBlocks.map((block) => {
                  const subject = subjectMap.get(block.subjectId);
                  const pCfg = PRIORITY_CONFIG[block.priority || 'medium'];
                  const durationMins =
                    block.durationMinutes ?? calculateMinutesFromRange(block.startTime, block.endTime);
                  const linkedTask = block.taskId || block.task_id ? taskMap.get((block.taskId || block.task_id)!) : null;

                  return (
                    <motion.div
                      key={block.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/70 hover:border-indigo-500/40 transition-all min-w-0"
                    >
                      {/* Left: Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Subject Color Pill */}
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: subject?.color || '#6366f1' }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] break-words leading-tight">
                              {block.title}
                            </h4>

                            {subject && (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: `${subject.color}15`,
                                  color: subject.color,
                                }}
                              >
                                {subject.name}
                              </span>
                            )}

                            <span
                              className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0',
                                pCfg.bg,
                                pCfg.text
                              )}
                            >
                              {block.priority || 'medium'}
                            </span>

                            {viewMode === 'all' && (
                              <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3" />
                                {block.date}
                              </span>
                            )}
                          </div>

                          {/* Time & Duration Info */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                            {block.startTime && block.endTime && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                <span>
                                  {block.startTime} – {block.endTime}
                                </span>
                              </span>
                            )}

                            <span className="text-indigo-400 font-semibold shrink-0">
                              {formatDurationHuman(durationMins)}
                            </span>

                            {linkedTask && (
                              <span className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1 truncate max-w-[200px]">
                                <Link2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">Task: {linkedTask.title}</span>
                              </span>
                            )}
                          </div>

                          {block.notes && (
                            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))] line-clamp-1 break-words">
                              {block.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[hsl(var(--border))]/50">
                        <button
                          type="button"
                          onClick={() =>
                            onStartFocus({
                              type: 'study-block',
                              id: block.id,
                              studyBlockId: block.id,
                              title: block.title,
                              subjectId: block.subjectId,
                            })
                          }
                          title="Start Timer for this topic"
                          className="inline-flex items-center justify-center gap-1.5 pl-[9px] pr-3 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold border border-indigo-500/25 shadow-sm transition active:scale-95 leading-none shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current shrink-0" />
                          <span className="leading-none translate-y-[1px]">Timer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditBlock(block)}
                          title="Edit study log"
                          className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteBlock(block.id)}
                          title="Delete study log"
                          className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* 2. Standalone Timer/Task Sessions from dailyLogs */}
                {standaloneSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--background))]/50 min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                            {session.title || 'Timer Session'}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                            {session.type || 'timer'}
                          </span>
                          {viewMode === 'all' && (
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {session.date}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                          Duration: <span className="font-semibold text-indigo-400">{session.durationMinutes || 0} mins</span>
                        </p>
                      </div>
                    </div>

                    {onDeleteSession && (
                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.date || selectedDateStr, session.id)}
                        title="Delete session"
                        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition self-end sm:self-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
