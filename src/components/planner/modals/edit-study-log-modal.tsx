'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Clock } from 'lucide-react';
import { calculateMinutesFromRange, formatDurationHuman } from '@/lib/study-analytics';
import type { Priority, StudyBlock, Task } from '@/types';

interface EditStudyLogModalProps {
  block: StudyBlock | null;
  subjects: { id: string; name: string; color: string }[];
  tasks?: Task[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<StudyBlock>) => Promise<void> | void;
}

export function EditStudyLogModal({
  block,
  subjects,
  tasks = [],
  onClose,
  onSave,
}: EditStudyLogModalProps) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [taskId, setTaskId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setSubjectId(block.subjectId || subjects[0]?.id || '');
      setDate(block.date);
      setTaskId(block.taskId || block.task_id || '');
      setStartTime(block.startTime || '09:00');
      setEndTime(block.endTime || '10:00');
      setPriority(block.priority || 'medium');
      setNotes(block.notes || '');
      setErrorMsg('');
    }
  }, [block, subjects]);

  const calculatedMinutes = useMemo(() => {
    return calculateMinutesFromRange(startTime, endTime);
  }, [startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!block || !title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSave(block.id, {
        title: title.trim(),
        subjectId,
        date,
        taskId: taskId ? taskId : null,
        startTime,
        endTime,
        durationMinutes: calculatedMinutes,
        priority,
        notes: notes.trim(),
      });
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Study log updated!', type: 'success' } })
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update study log');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!block) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden min-w-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 shrink-0 bg-[hsl(var(--card))]">
            <h3 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--foreground))] truncate min-w-0">
              <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="truncate">Edit Study Log</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form id="edit-log-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="min-w-0">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Subject
                </label>
                <select
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
                  Study Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Start Time
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
                  End Time
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

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-400 min-w-0 text-xs">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Calculated Duration:</span>
              <span className="font-bold text-[hsl(var(--foreground))]">
                {formatDurationHuman(calculatedMinutes)} ({calculatedMinutes} mins)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
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

              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Linked Task
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">None (Independent Study)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[hsl(var(--border))] px-5 py-3.5 shrink-0 bg-[hsl(var(--card))]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-log-form"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
