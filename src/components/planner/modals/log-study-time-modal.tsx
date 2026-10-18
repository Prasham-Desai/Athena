'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Clock, AlertTriangle, Sparkles, Link2 } from 'lucide-react';
import { getToday } from '@/lib/utils';
import { calculateMinutesFromRange, formatDurationHuman, checkIntervalOverlap } from '@/lib/study-analytics';
import type { Priority, Task, StudySession } from '@/types';

interface LogStudyTimeModalProps {
  open: boolean;
  initialDate?: string;
  subjects: { id: string; name: string; color: string }[];
  tasks?: Task[];
  sessions?: StudySession[];
  onClose: () => void;
  onAddStudyLog: (log: {
    title: string;
    date: string;
    subjectId: string;
    taskId?: string | null;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    priority: Priority;
    completed: boolean;
    notes: string;
  }) => Promise<void>;
}

export function LogStudyTimeModal({
  open,
  initialDate,
  subjects,
  tasks = [],
  sessions = [],
  onClose,
  onAddStudyLog,
}: LogStudyTimeModalProps) {
  const defaultDate = initialDate || getToday();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [customDuration, setCustomDuration] = useState<string>('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-calculated duration in minutes
  const calculatedMinutes = useMemo(() => {
    return calculateMinutesFromRange(startTime, endTime);
  }, [startTime, endTime]);

  const activeDurationMinutes = useCustomDuration && customDuration
    ? Math.max(1, parseInt(customDuration, 10) || 1)
    : calculatedMinutes;

  // Real-time overlap detection against existing sessions on this date
  const overlapInfo = useMemo(() => {
    const daySessions = sessions.filter((s) => s.startTime.startsWith(date));
    return checkIntervalOverlap(date, startTime, endTime, daySessions);
  }, [date, startTime, endTime, sessions]);

  const resetForm = () => {
    setTitle('');
    setSubjectId(subjects[0]?.id || '');
    setLinkedTaskId('');
    setDate(defaultDate);
    setStartTime('09:00');
    setEndTime('10:00');
    setCustomDuration('');
    setUseCustomDuration(false);
    setPriority('medium');
    setNotes('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a study title');
      return;
    }
    if (!subjectId) {
      setErrorMsg('Please select a subject');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMsg('Please specify start and end times');
      return;
    }
    if (activeDurationMinutes <= 0) {
      setErrorMsg('Duration must be greater than 0 minutes');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onAddStudyLog({
        title: title.trim(),
        date,
        subjectId,
        taskId: linkedTaskId ? linkedTaskId : null,
        startTime,
        endTime,
        durationMinutes: activeDurationMinutes,
        priority,
        completed: true, // Retrospective logs represent completed study time
        notes: notes.trim(),
      });

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `Logged ${formatDurationHuman(activeDurationMinutes)} for "${title.trim()}"!`,
            type: 'success',
          },
        })
      );

      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save study log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden min-w-0"
        >
          {/* Sticky Header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 shrink-0 bg-[hsl(var(--card))]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))] truncate">Log Study Time</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">Record past study time directly into your study logs</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form id="log-study-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Overlap Warning Alert */}
            {overlapInfo.hasOverlap && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Notice: Time Interval Overlap</p>
                  <p className="text-[11px] text-amber-400/90 mt-0.5 break-words">
                    {overlapInfo.overlapMinutes} mins overlap with existing session{' '}
                    {overlapInfo.overlappingSessionTitle ? `("${overlapInfo.overlappingSessionTitle}")` : ''}.
                    Unique study time will be deduplicated in your daily total.
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                Study Topic / Title <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Anatomy Revision (Nerves of Upper Limb)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Subject & Linked Task */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Linked Task <span className="text-[10px] lowercase normal-case opacity-70">(optional)</span>
                </label>
                <select
                  value={linkedTaskId}
                  onChange={(e) => setLinkedTaskId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">None (Independent Study)</option>
                  {tasks.filter((t) => !t.completed).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Study Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Calculated Duration Display & Override */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-2 text-indigo-400 min-w-0">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">Calculated Duration:</span>
                <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                  {formatDurationHuman(activeDurationMinutes)} ({activeDurationMinutes} mins)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseCustomDuration(!useCustomDuration)}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline shrink-0"
              >
                {useCustomDuration ? 'Use Time Range' : 'Adjust Minutes'}
              </button>
            </div>

            {useCustomDuration && (
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Manual Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customDuration || activeDurationMinutes}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Optional Notes */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                Notes / Key Learnings <span className="text-[10px] lowercase normal-case opacity-70">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you cover or accomplish during this session?"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </form>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[hsl(var(--border))] px-5 py-3.5 shrink-0 bg-[hsl(var(--card))]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="log-study-form"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? 'Saving…' : 'Log Study Time'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
