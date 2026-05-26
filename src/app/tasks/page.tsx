'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Trash2, Calendar, Filter, ListTodo, X, Clock, Repeat as RepeatIcon, CheckCircle2, Edit2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { useHydration } from '@/hooks/use-hydration';
import { cn, formatDate, getRelativeDate, PRIORITY_CONFIG, isOverdue, isToday, getToday } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';
import { TimeStudiedWidget } from '@/components/shared/time-studied-widget';
import { EmptyState } from '@/components/shared/empty-state';
import type { TaskCategory, Priority, Task } from '@/types';
import { addDays, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | 'active' | 'completed';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const CATEGORY_OPTIONS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'study', label: 'Study' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'revision', label: 'Revision' },
  { value: 'exam-prep', label: 'Exam Prep' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: 'bg-blue-500/10 text-blue-500',
  assignment: 'bg-purple-500/10 text-purple-500',
  revision: 'bg-amber-500/10 text-amber-500',
  'exam-prep': 'bg-rose-500/10 text-rose-500',
  other: 'bg-gray-500/10 text-gray-400',
};

// ---------------------------------------------------------------------------
// Edit Task Modal
// ---------------------------------------------------------------------------

function EditTaskModal({ open, onClose, task }: { open: boolean; onClose: () => void; task: Task | null }) {
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/30] px-6 py-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-indigo-500" />
                  Edit Task
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Read Chapter 4"
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Description <span className="text-[10px] lowercase normal-case opacity-70">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add some details..."
                      rows={2}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Est. Mins
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={estimatedMinutes}
                        onChange={(e) => setEstimatedMinutes(e.target.value)}
                        placeholder="e.g. 45"
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm capitalize transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {['study', 'assignment', 'revision', 'exam-prep', 'other'].map((c) => (
                          <option key={c} value={c}>
                            {c.replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm capitalize transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {(['high', 'medium', 'low', 'urgent'] as Priority[]).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Task Item
// ---------------------------------------------------------------------------

function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    priority: Priority;
    completed: boolean;
    date: string;
    estimatedMinutes?: number | null;
    actualMinutes?: number | null;
    createdAt: string;
  };
  onToggle: (id: string, isCurrentlyCompleted: boolean, estimatedMinutes: number) => void;
  onDelete: (id: string) => void;
  onEdit: (task: any) => void;
}) {
  const pCfg = PRIORITY_CONFIG[task.priority];

  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      className={cn(
        'group relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 sm:p-4 transition-colors hover:border-[hsl(var(--ring))]',
        task.completed && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => onToggle(task.id, task.completed, task.estimatedMinutes || 0)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300',
            task.completed
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-[hsl(var(--border))] hover:border-indigo-400',
          )}
        >
        <motion.svg
          viewBox="0 0 12 12"
          className="h-3 w-3 text-white"
          initial={false}
          animate={{ pathLength: task.completed ? 1 : 0, opacity: task.completed ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.path
            d="M2 6l3 3 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: task.completed ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.svg>
      </button>

      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <h4
          className={cn(
            'text-[15px] font-medium leading-tight truncate',
            task.completed
              ? 'text-[hsl(var(--muted-foreground))] line-through'
              : 'text-[hsl(var(--foreground))]',
          )}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] truncate">
            {task.description}
          </p>
        )}
      </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 sm:ml-4 mt-2 sm:mt-0">
        <div className="flex items-center gap-2">
          {task.estimatedMinutes && task.estimatedMinutes > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Est: {task.estimatedMinutes}m</span>
            </div>
          )}
          {task.completed && task.actualMinutes && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>Act: {task.actualMinutes}m</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', pCfg.bg, pCfg.text)}>
            {pCfg.label}
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', CATEGORY_COLORS[task.category])}>
            {task.category.replace('-', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="shrink-0 rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-all hover:bg-indigo-500/10 hover:text-indigo-500"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="shrink-0 rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-all hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Add Task Modal
// ---------------------------------------------------------------------------

function AddTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addTask = useTasksStore((s) => s.addTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState(getToday());
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatCount, setRepeatCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategory('study');
    setPriority('medium');
    setDate(getToday());
    setEstimatedMinutes('');
    setIsRepeating(false);
    setRepeatCount('1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || isSubmitting) return;

    setIsSubmitting(true);
    const baseTask = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
    };

    try {
      if (isRepeating && parseInt(repeatCount) > 1) {
        const count = parseInt(repeatCount);
        const startDate = new Date(date + 'T00:00:00');
        const promises = [];
        
        for (let i = 0; i < count; i++) {
          const nextDate = addDays(startDate, i);
          promises.push(addTask({
            ...baseTask,
            date: format(nextDate, 'yyyy-MM-dd'),
          }));
        }
        await Promise.all(promises);
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: `Added ${count} repeating tasks!`, type: 'success' } }),
        );
      } else {
        await addTask({
          ...baseTask,
          date,
        });
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Task added!', type: 'success' } }),
        );
      }

      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Add Task</h2>
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-[hsl(var(--muted))] transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Chapter 5 notes"
                  required
                  className="mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details…"
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="study">Study</option>
                    <option value="assignment">Assignment</option>
                    <option value="revision">Revision</option>
                    <option value="exam-prep">Exam Prep</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Est. Time (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="e.g. 30"
                    className="mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRepeating}
                    onChange={(e) => setIsRepeating(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <RepeatIcon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  Repeat this task
                </label>
                
                {isRepeating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 flex items-center gap-3 bg-[hsl(var(--muted))] p-3 rounded-xl"
                  >
                    <span className="text-sm">Create this task for</span>
                    <input
                      type="number"
                      min="2"
                      max="30"
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(e.target.value)}
                      className="w-16 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-center"
                    />
                    <span className="text-sm">consecutive days</span>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Saving...' : (isRepeating ? 'Add Repeating Tasks' : 'Add Task')}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Completion Modal
// ---------------------------------------------------------------------------
function CompletionModal({
  open,
  taskId,
  estimatedMinutes,
  onClose,
  onConfirm
}: {
  open: boolean;
  taskId: string | null;
  estimatedMinutes: number;
  onClose: () => void;
  onConfirm: (actualMinutes: number) => void;
}) {
  const [actual, setActual] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    if (open) {
      submittingRef.current = false;
      setActual(estimatedMinutes ? String(estimatedMinutes) : '');
    }
  }, [open, estimatedMinutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    onClose();
    Promise.resolve(onConfirm(actual ? parseInt(actual) : 0)).finally(() => {
      submittingRef.current = false;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold mb-2">Task Completed! 🎉</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">
          How much time did you actually spend on this task? This will be added to your total study time today.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Actual Time (min)</label>
            <input
              autoFocus
              type="number"
              min="0"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="e.g. 25"
              className="mt-1.5 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[hsl(var(--muted))] text-sm font-medium hover:opacity-80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-emerald-500/20"
            >
              Confirm
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TasksPage() {
  const hydrated = useHydration();
  const { tasks, toggleTask, deleteTask, updateTask } = useTasksStore();
  const { addStudySession, dailyLogs } = useActivityStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [prevAllDone, setPrevAllDone] = useState(false);

  const [completingTask, setCompletingTask] = useState<{ id: string, est: number } | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (statusFilter === 'active') return !t.completed;
        if (statusFilter === 'completed') return t.completed;
        return true;
      })
      .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
      .sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, statusFilter, categoryFilter]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {};
    for (const t of filteredTasks) {
      const d = t.date || 'No Date';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    }
    return groups;
  }, [filteredTasks]);

  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const totalCount = filteredTasks.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const allDone = totalCount > 0 && completedCount === totalCount;

  useEffect(() => {
    if (allDone && !prevAllDone) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    setPrevAllDone(allDone);
  }, [allDone, prevAllDone]);

  const handleToggleRequest = useCallback((id: string, isCompleted: boolean, est: number) => {
    if (!isCompleted) {
      setCompletingTask({ id, est });
    } else {
      toggleTask(id);
    }
  }, [toggleTask]);

  const handleConfirmCompletion = useCallback((actualMinutes: number) => {
    if (!completingTask) return;
    const { id } = completingTask;
    
    const now = new Date().toISOString();
    updateTask(id, { completed: true, completedAt: now, actualMinutes });
    
    if (actualMinutes > 0) {
      const today = getToday();
      const taskObj = tasks.find(t => t.id === id);
      
      const startTime = new Date(Date.now() - actualMinutes * 60000).toISOString();
      
      addStudySession(today, {
        startTime,
        endTime: now,
        durationMinutes: actualMinutes,
        type: 'task',
        title: taskObj?.title ? `Task: ${taskObj.title}` : 'Completed Task',
        taskId: id
      });
    }

    setCompletingTask(null);
  }, [completingTask, updateTask, addStudySession, tasks]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Task deleted', type: 'info' } }),
      );
    },
    [deleteTask],
  );

  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        <div className="h-10 w-full rounded-xl bg-[hsl(var(--muted))]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[hsl(var(--muted))]" />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Tasks" description="Checking off tasks feels amazing — keep up the good work! ✅">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </PageHeader>

      <div className="mb-8">
        <TimeStudiedWidget date={getToday()} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 space-y-3"
      >
        <div className="flex items-center gap-1 rounded-xl bg-[hsl(var(--muted))] p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-medium transition-all',
                statusFilter === tab.value
                  ? 'bg-[hsl(var(--card))] shadow-sm text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                categoryFilter === opt.value
                  ? 'bg-indigo-500/10 text-indigo-500'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Progress
            </span>
            <span className="text-xs font-semibold">
              {completedCount}/{totalCount} ({progressPct}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            />
          </div>
        </motion.div>
      )}

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description={
            statusFilter === 'completed'
              ? "You haven't completed any tasks yet. Keep going!"
              : "Add your first task to start tracking your progress."
          }
          actionLabel="Add Task"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedTasks).map(([date, dateTasks]) => (
              <motion.div key={date} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-sm font-semibold tracking-tight text-[hsl(var(--muted-foreground))] mb-3 px-1 border-b border-[hsl(var(--border))] pb-2">
                  {getRelativeDate(date)} <span className="font-normal text-xs ml-2">({formatDate(date)})</span>
                </h3>
                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleRequest}
                      onDelete={handleDelete}
                      onEdit={(t) => setEditTask(t)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AddTaskModal open={showModal} onClose={() => setShowModal(false)} />
      <EditTaskModal open={!!editTask} onClose={() => setEditTask(null)} task={editTask} />
      
      <CompletionModal 
        open={completingTask !== null} 
        taskId={completingTask?.id || null}
        estimatedMinutes={completingTask?.est || 0}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleConfirmCompletion}
      />
    </>
  );
}
