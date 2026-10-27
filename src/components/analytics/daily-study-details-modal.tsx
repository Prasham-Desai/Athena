'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Timer,
  FileText,
  Target,
} from 'lucide-react';
import { format, parseISO, addDays, subDays, differenceInCalendarDays, startOfYear } from 'date-fns';
import type { DailyLog, Subject, StudyBlock, ActivityEntry, StudySession } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getSubjectDisplayName } from '@/lib/subject-display';
import { plannerDateHref } from '@/lib/routes';

interface DailyStudyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  onDateChange: (newDateStr: string) => void;
  dailyLogs: DailyLog[];
  subjects: Subject[];
  studyBlocks?: StudyBlock[];
  activities?: ActivityEntry[];
  dailyGoalHours?: number;
}

export function DailyStudyDetailsModal({
  isOpen,
  onClose,
  dateStr,
  onDateChange,
  dailyLogs,
  subjects,
  studyBlocks = [],
  activities = [],
  dailyGoalHours = 6,
}: DailyStudyDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeDate = useMemo(() => {
    if (!dateStr) return new Date();
    try {
      return parseISO(dateStr);
    } catch {
      return new Date();
    }
  }, [dateStr]);

  const currentDateFormatted = useMemo(() => {
    return format(activeDate, 'EEEE, MMMM d, yyyy');
  }, [activeDate]);

  // Current day's daily log
  const currentLog = useMemo(() => {
    if (!dateStr) return null;
    return dailyLogs.find((l) => l.date === dateStr) || null;
  }, [dailyLogs, dateStr]);

  // Current day's study blocks
  const dayBlocks = useMemo(() => {
    if (!dateStr) return [];
    return studyBlocks.filter((b) => b.date === dateStr);
  }, [studyBlocks, dateStr]);

  // Subjects lookup map
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Activities on this day
  const dayActivities = useMemo(() => {
    if (!dateStr) return [];
    return activities.filter((act) => {
      const actDate = act.timestamp ? format(parseISO(act.timestamp), 'yyyy-MM-dd') : '';
      return actDate === dateStr;
    });
  }, [activities, dateStr]);

  // Topic completions & revisions on this date
  const completedActivities = useMemo(
    () => dayActivities.filter((a) => a.type === 'topic-completed'),
    [dayActivities]
  );

  const revisedActivities = useMemo(
    () => dayActivities.filter((a) => a.type === 'topic-revised'),
    [dayActivities]
  );

  // Total study minutes calculation
  const totalMinutes = currentLog?.studyMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedDuration = `${hours}h ${minutes}m`;

  const goalPercent =
    dailyGoalHours > 0 ? Math.min(100, Math.round(((totalMinutes / 60) / dailyGoalHours) * 100)) : 0;

  // Study sessions to show: from currentLog.sessions or constructed from studyBlocks
  const sessions: StudySession[] = useMemo(() => {
    if (currentLog?.sessions && currentLog.sessions.length > 0) {
      return currentLog.sessions;
    }
    // If no direct sessions stored, map studyBlocks for that day
    if (dayBlocks.length > 0) {
      return dayBlocks.map((b) => ({
        id: b.id,
        startTime: `${b.date}T${b.startTime || '00:00'}:00`,
        endTime: `${b.date}T${b.endTime || '00:00'}:00`,
        durationMinutes: b.durationMinutes || 0,
        type: 'study-block' as const,
        title: b.title,
        studyBlockId: b.id,
      }));
    }
    // If daily_progress has recorded study minutes, provide a clear session entry
    if (totalMinutes > 0) {
      return [
        {
          id: `log-${dateStr}`,
          startTime: `${dateStr}T09:00:00`,
          endTime: `${dateStr}T${9 + Math.floor(totalMinutes / 60)}:${totalMinutes % 60}:00`,
          durationMinutes: totalMinutes,
          type: 'manual' as const,
          title: 'Recorded Study Time',
        },
      ];
    }
    return [];
  }, [currentLog, dayBlocks]);

  const handlePrevDay = () => {
    if (!dateStr) return;
    const prev = subDays(activeDate, 1);
    onDateChange(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    if (!dateStr) return;
    const next = addDays(activeDate, 1);
    onDateChange(format(next, 'yyyy-MM-dd'));
  };

  if (!isOpen || !dateStr) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-2xl max-h-[88vh]
                   bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted))]/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Previous day"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="p-1 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                title="Next day"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[hsl(var(--foreground))]">
                {currentDateFormatted}
              </h2>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Day {differenceInCalendarDays(activeDate, startOfYear(activeDate)) + 1} of {format(activeDate, 'yyyy')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {/* Daily Totals Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Study Time
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                {totalMinutes > 0 ? formattedDuration : '0m'}
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400" />
                Goal Progress
              </div>
              <div className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                {goalPercent}%
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-normal ml-1">
                  ({dailyGoalHours}h target)
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                Topics Completed
              </div>
              <div className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                {currentLog?.topicsCompleted || 0}
              </div>
            </div>

            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-purple-400" />
                Revisions Done
              </div>
              <div className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mt-1">
                {currentLog?.revisionsCompleted || 0}
              </div>
            </div>
          </div>

          {/* Goal Progress Bar */}
          {dailyGoalHours > 0 && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
              <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                  Daily Study Goal Status
                </span>
                <span className="font-semibold text-[hsl(var(--foreground))]">
                  {totalMinutes > 0 ? (totalMinutes / 60).toFixed(1) : '0'} / {dailyGoalHours} hours
                </span>
              </div>
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    goalPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                  )}
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Section: Study Sessions Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-emerald-400" />
                Study Sessions Recorded ({sessions.length})
              </h3>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No individual study sessions recorded for this date.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess, idx) => {
                  let formattedStart = '';
                  let formattedEnd = '';
                  try {
                    formattedStart = format(parseISO(sess.startTime), 'hh:mm a');
                    formattedEnd = format(parseISO(sess.endTime), 'hh:mm a');
                  } catch {
                    formattedStart = sess.startTime || '';
                    formattedEnd = sess.endTime || '';
                  }

                  const sBlock = sess.studyBlockId
                    ? studyBlocks.find((b) => b.id === sess.studyBlockId)
                    : null;
                  const subject = sBlock?.subjectId ? subjectMap.get(sBlock.subjectId) : null;

                  return (
                    <div
                      key={sess.id || idx}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 hover:bg-[hsl(var(--muted))]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-medium text-xs sm:text-sm text-[hsl(var(--foreground))]">
                              {sess.title || (sess.type === 'manual' ? 'Manual Study Session' : 'Study Session')}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                              {formattedStart && formattedEnd ? `${formattedStart} – ${formattedEnd}` : 'Untimed'}
                            </div>
                            {subject && (
                              <div
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium mt-1.5"
                                style={{
                                  backgroundColor: `${subject.color}18`,
                                  color: subject.color,
                                  borderColor: `${subject.color}40`,
                                }}
                              >
                                {getSubjectDisplayName(subject)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-semibold text-xs text-emerald-400">
                            {sess.durationMinutes} min
                          </span>
                          <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mt-0.5">
                            {sess.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Topics Completed on this Day */}
          {completedActivities.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5 mb-2.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                Topics Completed First Time ({completedActivities.length})
              </h3>
              <div className="space-y-1.5">
                {completedActivities.map((act, idx) => (
                  <div
                    key={act.id || `comp-${idx}`}
                    className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 px-3 py-2 text-xs"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[hsl(var(--foreground))] truncate">{act.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Revisions on this Day */}
          {revisedActivities.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5 mb-2.5">
                <RotateCcw className="h-4 w-4 text-purple-400" />
                Revision Events ({revisedActivities.length})
              </h3>
              <div className="space-y-1.5">
                {revisedActivities.map((act, idx) => (
                  <div
                    key={act.id || `rev-${idx}`}
                    className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 px-3 py-2 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span className="text-[hsl(var(--foreground))] truncate">{act.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 flex items-center justify-between">
          <Link
            href={plannerDateHref(dateStr)}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Open in Daily Planner</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 text-xs font-semibold bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
