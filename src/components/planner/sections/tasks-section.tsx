'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Play,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  Circle,
  ChevronDown,
} from 'lucide-react';
import { cn, formatDate, getRelativeDate, PRIORITY_CONFIG } from '@/lib/utils';
import type { Task, TaskCategory, Priority } from '@/types';
import type { ActiveTimerTarget } from '@/store/timer-store';
import { SectionLoader, Skeleton } from '@/components/ui/loading';

type StatusFilter = 'all' | 'active' | 'completed';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const CATEGORY_OPTIONS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'study', label: 'Study' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'revision', label: 'Revision' },
  { value: 'exam-prep', label: 'Exam Prep' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: 'bg-blue-500/10 text-blue-400',
  assignment: 'bg-purple-500/10 text-purple-400',
  revision: 'bg-amber-500/10 text-amber-400',
  'exam-prep': 'bg-rose-500/10 text-rose-400',
  other: 'bg-gray-500/10 text-gray-400',
};

interface TasksSectionProps {
  tasks: Task[];
  isLoading?: boolean;
  todayStr: string;
  onOpenAddTaskModal: () => void;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStartFocus: (target: ActiveTimerTarget) => void;
}

export function TasksSection({
  tasks,
  isLoading = false,
  todayStr,
  onOpenAddTaskModal,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onStartFocus,
}: TasksSectionProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(15);

  const filteredTasks = useMemo(() => {
    const list = tasks.filter((task) => {
      // Status
      if (statusFilter === 'active' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;

      // Category
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });

    const compareCompletedTasks = (a: Task, b: Task) => {
      const compDateA = (a.completedAt || (a as any).completed_at || '').slice(0, 10);
      const compDateB = (b.completedAt || (b as any).completed_at || '').slice(0, 10);

      // 1. More recently completed calendar day first (e.g. today before earlier dates)
      const compDateDiff = compDateB.localeCompare(compDateA);
      if (compDateDiff !== 0) return compDateDiff;

      // 2. If completed on the same date (e.g. bulk completed), the task with the later curriculum/study date is on top
      const taskDateA = (a.date || '').slice(0, 10);
      const taskDateB = (b.date || '').slice(0, 10);
      const taskDateDiff = taskDateB.localeCompare(taskDateA);
      if (taskDateDiff !== 0) return taskDateDiff;

      // 3. Exact completedAt timestamp descending
      const compAtA = a.completedAt || (a as any).completed_at || '';
      const compAtB = b.completedAt || (b as any).completed_at || '';
      const compAtDiff = compAtB.localeCompare(compAtA);
      if (compAtDiff !== 0) return compAtDiff;

      // 4. Fallback to createdAt descending
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    };

    if (statusFilter === 'completed') {
      // Latest completed tasks on top, older ones at the bottom
      return [...list].sort(compareCompletedTasks);
    }

    if (statusFilter === 'all') {
      // Active tasks first; for completed tasks, latest completed on top
      return [...list].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        if (a.completed) {
          return compareCompletedTasks(a, b);
        }
        return 0;
      });
    }

    return list;
  }, [tasks, statusFilter, categoryFilter, searchQuery]);

  const displayedTasks = useMemo(() => {
    return filteredTasks.slice(0, displayLimit);
  }, [filteredTasks, displayLimit]);

  const hasMore = filteredTasks.length > displayLimit;

  return (
    <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6 shadow-sm min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[hsl(var(--border))] min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))]">Tasks</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                {filteredTasks.length}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              Actionable outcomes, priorities, and study goals
            </p>
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={onOpenAddTaskModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-emerald-500/20 transition self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 min-w-0">
        {/* Status Tabs with Counts */}
        <LayoutGroup id="tasks-status-tabs">
          <div className="flex items-center p-1 rounded-xl bg-[hsl(var(--muted))] text-xs font-semibold shrink-0 relative select-none">
            {STATUS_TABS.map((tab) => {
              const isSelected = statusFilter === tab.value;
              const count =
                tab.value === 'all'
                  ? tasks.length
                  : tab.value === 'active'
                  ? tasks.filter((t) => !t.completed).length
                  : tasks.filter((t) => t.completed).length;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setDisplayLimit(15);
                  }}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 z-10',
                    isSelected
                      ? 'text-[hsl(var(--foreground))] font-bold'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="tasks-status-active-pill"
                      className="absolute inset-0 bg-[hsl(var(--card))] rounded-lg shadow-sm border border-[hsl(var(--border))]/60"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 32,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {isLoading ? <Skeleton className="relative z-10 h-4 w-5 rounded-md" /> : <span
                    className={cn(
                      'relative z-10 text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-colors',
                      tab.value === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                        : tab.value === 'completed'
                        ? 'bg-indigo-500/15 text-indigo-400 font-bold'
                        : 'bg-[hsl(var(--muted-foreground))]/15'
                    )}
                  >
                    {count}
                  </span>}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Category & Search */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md min-w-0">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as TaskCategory | 'all');
              setDisplayLimit(8);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs text-[hsl(var(--foreground))] capitalize shrink-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <SectionLoader rows={4} />
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-6 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-3 text-[hsl(var(--muted-foreground))]">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">No tasks match your filter</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mt-1">
            {statusFilter === 'active'
              ? 'All active tasks are complete! Add a new task to continue.'
              : 'Try selecting a different status or category filter.'}
          </p>
          <button
            onClick={onOpenAddTaskModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:opacity-90 shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 min-w-0">
          <AnimatePresence>
            {displayedTasks.map((task) => {
              const pCfg = PRIORITY_CONFIG[task.priority || 'medium'];
              const catClass = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other;
              const isDueToday = task.date === todayStr;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={cn(
                    'group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all min-w-0',
                    task.completed
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--background))]/70 hover:border-emerald-500/40 hover:bg-[hsl(var(--card))]'
                  )}
                >
                  {/* Left: Checkbox & Title/Description */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-[hsl(var(--muted-foreground))] hover:text-emerald-500 transition shrink-0"
                      title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-emerald-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 pr-2">
                      <h3
                        className={cn(
                          'text-sm font-semibold text-[hsl(var(--foreground))] break-words leading-snug',
                          task.completed && 'line-through text-[hsl(var(--muted-foreground))]'
                        )}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1 break-words">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Date, Estimates, Tags, and Actions (All on the far right) */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-x-4 gap-y-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-[hsl(var(--border))]/50">
                    {/* Date & Est. Timing */}
                    <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                      {task.date && (
                        <span className="inline-flex items-center gap-1.5 shrink-0 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                          <span>{getRelativeDate(task.date)}</span>
                        </span>
                      )}

                      {task.completed && task.actualMinutes ? (
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Studied {task.actualMinutes}m</span>
                        </span>
                      ) : task.estimatedMinutes ? (
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-blue-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Est: {task.estimatedMinutes}m</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Tags: Due Today, Category, Difficulty / Priority */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDueToday && !task.completed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                          Due Today
                        </span>
                      )}

                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0', catClass)}>
                        {task.category}
                      </span>

                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0', pCfg.bg, pCfg.text)}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Actions: Timer Button, Edit, Delete */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-1 md:pl-2 md:border-l md:border-[hsl(var(--border))]/60">
                      {!task.completed && (
                        <button
                          onClick={() =>
                            onStartFocus({
                              type: 'task',
                              id: task.id,
                              taskId: task.id,
                              title: task.title,
                            })
                          }
                          title="Start Timer for this task"
                          className="inline-flex items-center justify-center gap-1.5 pl-[9px] pr-3 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold border border-emerald-500/25 shadow-sm transition active:scale-95 leading-none shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current shrink-0" />
                          <span className="leading-none translate-y-[1px]">Timer</span>
                        </button>
                      )}

                      <button
                        onClick={() => onEditTask(task)}
                        title="Edit task"
                        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete task"
                        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Show More Button if tasks exceed limit */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 12)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 hover:bg-[hsl(var(--muted))] text-xs font-semibold text-[hsl(var(--foreground))] transition"
              >
                <span>Show More ({filteredTasks.length - displayLimit} remaining)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
