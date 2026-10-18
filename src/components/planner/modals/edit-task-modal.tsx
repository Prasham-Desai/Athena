'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, X } from 'lucide-react';
import { useTasksStore } from '@/store/tasks-store';
import type { Task, TaskCategory, Priority } from '@/types';

export function EditTaskModal({
  open,
  onClose,
  task,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}) {
  const updateTask = useTasksStore((s) => s.updateTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setCategory(task.category);
      setPriority(task.priority);
      setDate(task.date || '');
      setEstimatedMinutes(task.estimatedMinutes ? String(task.estimatedMinutes) : '');
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim() || !date || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        date,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      });

      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Task updated successfully', type: 'success' } }),
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !task) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 shrink-0 bg-[hsl(var(--card))]">
            <h2 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--foreground))] min-w-0 truncate">
              <ListTodo className="h-5 w-5 text-indigo-500 shrink-0" />
              <span className="truncate">Edit Task</span>
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form id="edit-task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Read Chapter 4"
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Description <span className="text-[10px] lowercase normal-case opacity-70">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details…"
                rows={2}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] resize-none transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Est. Minutes
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] capitalize transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {['study', 'assignment', 'revision', 'exam-prep', 'other'].map((c) => (
                    <option key={c} value={c}>
                      {c.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1.5 block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] capitalize transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

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
              form="edit-task-form"
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
