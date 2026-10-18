'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, X, Repeat as RepeatIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn, getToday } from '@/lib/utils';
import type { TaskCategory, Priority, Task } from '@/types';

interface AddTaskModalProps {
  open: boolean;
  initialDate?: string;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'completed'>) => Promise<void>;
}

export function AddTaskModal({
  open,
  initialDate,
  onClose,
  onAddTask,
}: AddTaskModalProps) {
  const defaultDate = initialDate || getToday();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState(defaultDate);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatCount, setRepeatCount] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('study');
    setPriority('medium');
    setDate(defaultDate);
    setEstimatedMinutes('');
    setIsRepeating(false);
    setRepeatCount('2');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a task title');
      return;
    }
    if (!date) {
      setErrorMsg('Please choose a due date');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const baseTask = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
      };

      if (isRepeating && parseInt(repeatCount, 10) > 1) {
        const count = Math.min(30, Math.max(2, parseInt(repeatCount, 10)));
        const startDate = new Date(date + 'T00:00:00');
        const promises = [];

        for (let i = 0; i < count; i++) {
          const nextDate = addDays(startDate, i);
          promises.push(
            onAddTask({
              ...baseTask,
              date: format(nextDate, 'yyyy-MM-dd'),
            })
          );
        }
        await Promise.all(promises);
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: `Added ${count} repeating tasks!`, type: 'success' } })
        );
      } else {
        await onAddTask({
          ...baseTask,
          date,
        });
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Task added successfully!', type: 'success' } })
        );
      }

      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

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
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))] truncate">New Task</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">Create an actionable study goal or checklist item</p>
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
          <form id="add-task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Read Roganidana Chapter 3 notes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Description */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                Description <span className="text-[10px] lowercase normal-case opacity-70">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key sub-points or reminder notes…"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] capitalize focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="study">Study</option>
                  <option value="assignment">Assignment</option>
                  <option value="revision">Revision</option>
                  <option value="exam-prep">Exam Prep</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] capitalize focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Date & Estimated Minutes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="min-w-0">
                <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                  Est. Minutes <span className="text-[10px] lowercase normal-case opacity-70">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Recurrence Option */}
            <div className="pt-1 min-w-0">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[hsl(var(--foreground))]">
                <input
                  type="checkbox"
                  checked={isRepeating}
                  onChange={(e) => setIsRepeating(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <RepeatIcon className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                <span>Repeat this task for multiple consecutive days</span>
              </label>

              {isRepeating && (
                <div className="mt-2 flex items-center gap-2.5 bg-[hsl(var(--muted))]/60 p-3 rounded-xl border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] min-w-0">
                  <span>Repeat for</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(e.target.value)}
                    className="w-16 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 py-1 text-xs text-center font-bold text-[hsl(var(--foreground))]"
                  />
                  <span>consecutive days</span>
                </div>
              )}
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
              form="add-task-form"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-md shadow-emerald-500/20"
            >
              {isSubmitting ? 'Saving…' : isRepeating ? `Add ${repeatCount} Tasks` : 'Add Task'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
