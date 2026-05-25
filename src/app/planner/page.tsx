'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  CalendarDays,
  Timer,
  BookOpen,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday as isDateToday } from 'date-fns';

import { usePlannerStore } from '@/store/planner-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, formatTime, PRIORITY_CONFIG, getToday } from '@/lib/utils';

// ==========================================================================
// Calendar component
// ==========================================================================

function Calendar({
  selectedDate,
  onSelectDate,
  studyBlocks,
  tasks,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  studyBlocks: { date: string }[];
  tasks: { date: string }[];
}) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function getDotCount(day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const blockCount = studyBlocks.filter((b) => b.date === dateStr).length;
    const taskCount = tasks.filter((t) => t.date === dateStr).length;
    return blockCount + taskCount;
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold">{format(viewMonth, 'MMMM yyyy')}</h3>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-[hsl(var(--muted-foreground))] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isDateToday(day);
          const count = getDotCount(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-xl text-xs transition-all',
                !inMonth && 'opacity-30',
                selected
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : today
                  ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                  : 'hover:bg-[hsl(var(--muted))]'
              )}
            >
              <span className="font-medium">{format(day, 'd')}</span>
              {count > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1 h-1 rounded-full',
                        selected ? 'bg-white/70' : 'bg-indigo-500'
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick jump */}
      <div className="flex justify-center mt-3">
        <button
          onClick={() => {
            const today = new Date();
            setViewMonth(today);
            onSelectDate(today);
          }}
          className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition"
        >
          Jump to Today
        </button>
      </div>
    </div>
  );
}

// ==========================================================================
// Add item modal
// ==========================================================================

type AddMode = 'study-block' | 'task';

function AddItemModal({
  date,
  subjects,
  onClose,
  onAddStudyBlock,
  onAddTask,
}: {
  date: string;
  subjects: { id: string; name: string; color: string }[];
  onClose: () => void;
  onAddStudyBlock: (block: any) => void;
  onAddTask: (task: any) => void;
}) {
  const [mode, setMode] = useState<AddMode>('study-block');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'study' | 'assignment' | 'revision' | 'exam-prep' | 'other'>('study');

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (mode === 'study-block') {
      onAddStudyBlock({
        date,
        subjectId,
        title: title.trim(),
        startTime,
        endTime,
        priority,
        completed: false,
        notes: '',
      });
    } else {
      onAddTask({
        title: title.trim(),
        description,
        category,
        priority,
        date,
      });
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Add to {format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[hsl(var(--muted))] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5">
          {([
            { value: 'study-block', label: 'Study Block', icon: BookOpen },
            { value: 'task', label: 'Task', icon: CheckCircle2 },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
                mode === value
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === 'study-block' ? 'Study block title...' : 'Task title...'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {mode === 'study-block' ? (
            <>
              {/* Subject */}
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Start</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">End</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
              />
              {/* Category */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="study">Study</option>
                <option value="assignment">Assignment</option>
                <option value="revision">Revision</option>
                <option value="exam-prep">Exam Prep</option>
                <option value="other">Other</option>
              </select>
            </>
          )}

          {/* Priority */}
          <div>
            <label className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Priority</label>
            <div className="flex gap-2 mt-1.5">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                const config = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-medium transition-all border-2',
                      priority === p
                        ? 'border-current shadow-sm'
                        : 'border-transparent bg-[hsl(var(--muted))]',
                      config.text
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full mt-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 shadow-lg shadow-indigo-500/20"
        >
          {mode === 'study-block' ? 'Add Study Block' : 'Add Task'}
        </button>
      </motion.div>
    </motion.div>
  );
}

import { useSettingsStore } from '@/store/settings-store';

// ==========================================================================
// Time Studied Widget (Dual Timer)
// ==========================================================================

function TimeStudiedWidget({ date }: { date: string }) {
  const { dailyLogs, updateDailyLog, addStudySession } = useActivityStore();
  const { settings } = useSettingsStore();
  
  const log = dailyLogs.find((l) => l.date === date);
  const totalMinutes = log?.studyMinutes ?? 0;
  const sessions = log?.sessions ?? [];
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Manual Edit State
  const [editing, setEditing] = useState(false);
  const [inputHours, setInputHours] = useState(String(totalHours));
  const [inputMins, setInputMins] = useState(String(totalMins));

  // Main Timer State
  const [isMainRunning, setIsMainRunning] = useState(false);
  const [mainSeconds, setMainSeconds] = useState(0);

  // Pomodoro State
  const [pomoMode, setPomoMode] = useState<'study' | 'break'>('study');
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(settings.pomodoroMinutes * 60);

  // Sync initial pomodoro time if settings change
  useEffect(() => {
    if (!isPomoRunning && mainSeconds === 0) {
      setPomoSecondsLeft(pomoMode === 'study' ? settings.pomodoroMinutes * 60 : settings.breakMinutes * 60);
    }
  }, [settings.pomodoroMinutes, settings.breakMinutes, isPomoRunning, mainSeconds, pomoMode]);

  // Main Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMainRunning) {
      interval = setInterval(() => {
        setMainSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMainRunning]);

  // Pomodoro Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomoRunning) {
      interval = setInterval(() => {
        setPomoSecondsLeft((prev) => {
          if (prev <= 1) {
            // Reached zero
            if (pomoMode === 'study') {
              window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Study session complete! Take a break.', type: 'info' } }));
              setPomoMode('break');
              setIsPomoRunning(false); // auto-pause
              return settings.breakMinutes * 60;
            } else {
              window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Break is over! Time to focus.', type: 'info' } }));
              setPomoMode('study');
              setIsPomoRunning(false); // auto-pause
              return settings.pomodoroMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoMode, settings.pomodoroMinutes, settings.breakMinutes]);

  const [mainStartTime, setMainStartTime] = useState<string | null>(null);

  const handleMainToggle = () => {
    const nextState = !isMainRunning;
    setIsMainRunning(nextState);
    
    if (nextState) {
      if (!mainStartTime) setMainStartTime(new Date().toISOString());
      if (!isPomoRunning) setIsPomoRunning(true);
    }
  };

  const handleMainSave = () => {
    const minsToSave = Math.floor(mainSeconds / 60);
    if (minsToSave > 0) {
      addStudySession(date, {
        startTime: mainStartTime || new Date(Date.now() - minsToSave * 60000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: minsToSave,
        type: 'timer',
        title: 'Stopwatch Session'
      });
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Added ${minsToSave} minutes to today's total!`, type: 'success' } }));
    }
    setMainSeconds(0);
    setIsMainRunning(false);
    setMainStartTime(null);
  };

  const handleManualSave = () => {
    const newTotalMins = Math.max(0, Number(inputHours) * 60 + Number(inputMins));
    const difference = newTotalMins - totalMinutes;
    
    if (difference > 0) {
      addStudySession(date, {
        startTime: new Date(Date.now() - difference * 60000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: difference,
        type: 'manual',
        title: 'Manual Entry'
      });
    } else {
      updateDailyLog(date, { studyMinutes: newTotalMins });
    }
    
    setEditing(false);
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Study time updated!', type: 'success' } }));
  };

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-5">
      {/* Total Time Studied Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Timer className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Total Time Studied Today</h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{format(new Date(date + 'T00:00:00'), 'EEEE, MMM d')}</p>
          </div>
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} value={inputHours} onChange={(e) => setInputHours(e.target.value)}
              className="w-12 px-2 py-1.5 rounded-lg border bg-[hsl(var(--background))] text-sm text-center"
            />
            <span className="text-xs">h</span>
            <input
              type="number" min={0} max={59} value={inputMins} onChange={(e) => setInputMins(e.target.value)}
              className="w-12 px-2 py-1.5 rounded-lg border bg-[hsl(var(--background))] text-sm text-center"
            />
            <span className="text-xs">m</span>
            <button onClick={handleManualSave} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Save</button>
            <button onClick={() => setEditing(false)} className="px-2 py-1 rounded bg-[hsl(var(--muted))] text-xs">Cancel</button>
          </div>
        ) : (
          <button onClick={() => { setInputHours(String(totalHours)); setInputMins(String(totalMins)); setEditing(true); }} className="text-right group">
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className="text-2xl font-bold text-emerald-500">{totalHours}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">h</span>
              <span className="text-2xl font-bold text-emerald-500 ml-1">{totalMins.toString().padStart(2, '0')}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">m</span>
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition block">click to edit</span>
          </button>
        )}
      </div>

      {/* Dual Timers Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Main User Timer */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col items-center">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Main Stopwatch</span>
          <div className="text-3xl font-bold font-mono tracking-tight mb-4">
            {formatSecs(mainSeconds)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMainToggle}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition text-white shadow-sm", isMainRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700")}
            >
              {isMainRunning ? 'Pause' : 'Start'}
            </button>
            {mainSeconds > 0 && (
              <button
                onClick={handleMainSave}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
              >
                Save
              </button>
            )}
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-3 text-center leading-tight">
            Tracks actual study time.<br/>Saves to total when stopped.
          </p>
        </div>

        {/* Pomodoro Timer */}
        <div className={cn("rounded-xl border p-4 flex flex-col items-center transition-colors", pomoMode === 'study' ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5")}>
          <span className={cn("text-xs font-semibold uppercase tracking-wider mb-2", pomoMode === 'study' ? "text-rose-500" : "text-emerald-500")}>
            {pomoMode === 'study' ? 'Pomodoro (Focus)' : 'Pomodoro (Break)'}
          </span>
          <div className="text-3xl font-bold font-mono tracking-tight mb-4">
            {formatSecs(pomoSecondsLeft)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPomoRunning(!isPomoRunning)}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition text-white shadow-sm", pomoMode === 'study' ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700")}
            >
              {isPomoRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setIsPomoRunning(false);
                setPomoSecondsLeft(pomoMode === 'study' ? settings.pomodoroMinutes * 60 : settings.breakMinutes * 60);
              }}
              className="px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-sm font-medium hover:opacity-80 transition"
            >
              Reset
            </button>
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-3 text-center leading-tight">
            Ideal rhythm guide.<br/>Auto-pauses on completion.
          </p>
        </div>
      </div>

      {/* Individual Sessions List */}
      {sessions.length > 0 && (
        <div className="pt-4 border-t border-[hsl(var(--border))]">
          <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">Today's Sessions</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {[...sessions].reverse().map((session) => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))] text-sm">
                <div>
                  <p className="font-medium">{session.title || 'Study Session'}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{session.durationMinutes} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// Main Planner Page
// ==========================================================================

export default function PlannerPage() {
  const hydrated = useHydration();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const { studyBlocks, addStudyBlock, toggleStudyBlock, deleteStudyBlock } = usePlannerStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  const { tasks, addTask, toggleTask, deleteTask } = useTasksStore();
  const { addActivity } = useActivityStore();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Items for the selected date
  const dayBlocks = useMemo(
    () => studyBlocks.filter((b) => b.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [studyBlocks, dateStr]
  );

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === dateStr),
    [tasks, dateStr]
  );

  const totalItems = dayBlocks.length + dayTasks.length;
  const completedItems = dayBlocks.filter((b) => b.completed).length + dayTasks.filter((t) => t.completed).length;
  const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleAddStudyBlock = useCallback((block: any) => {
    addStudyBlock(block);
    addActivity({ type: 'study-block-completed', description: `Scheduled "${block.title}"`, color: '#6366f1' });
    window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'Study block added!', type: 'success' } }));
  }, [addStudyBlock, addActivity]);

  const handleAddTask = useCallback((task: any) => {
    addTask(task);
    window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'Task added!', type: 'success' } }));
  }, [addTask]);

  const handleToggleBlock = useCallback((id: string, title: string) => {
    toggleStudyBlock(id);
    const block = studyBlocks.find(b => b.id === id);
    if (block && !block.completed) {
      addActivity({ type: 'study-block-completed', description: `Completed "${title}"`, color: '#22c55e' });
    }
  }, [toggleStudyBlock, studyBlocks, addActivity]);

  const handleToggleTask = useCallback((id: string) => {
    toggleTask(id);
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      addActivity({ type: 'task-completed', description: `Completed "${task.title}"`, color: '#22c55e' });
    }
  }, [toggleTask, tasks, addActivity]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[hsl(var(--muted-foreground))] animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Daily Planner"
        description="A well-planned day is a well-spent day — you're doing great! 🗓️"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Left: Calendar + Time Studied */}
        <div className="space-y-4">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            studyBlocks={studyBlocks}
            tasks={tasks}
          />
          <TimeStudiedWidget date={dateStr} />
        </div>

        {/* Right: Day detail */}
        <div className="space-y-4">
          {/* Day header + progress */}
          <motion.div
            key={dateStr}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMMM d')}</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {totalItems === 0 ? 'No items scheduled' : `${completedItems} of ${totalItems} completed`}
                </p>
              </div>
              {totalItems > 0 && (
                <span className="text-sm font-bold text-indigo-400">{completionPercent}%</span>
              )}
            </div>
            {totalItems > 0 && (
              <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            )}
          </motion.div>

          {/* Study blocks */}
          {dayBlocks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 px-1">
                Study Blocks ({dayBlocks.length})
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {dayBlocks.map((block) => {
                    const subject = subjects.find((s) => s.id === block.subjectId);
                    const priorityConf = PRIORITY_CONFIG[block.priority];
                    return (
                      <motion.div
                        key={block.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl border bg-[hsl(var(--card))] p-4 transition-all',
                          block.completed
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'
                        )}
                      >
                        <button
                          onClick={() => handleToggleBlock(block.id, block.title)}
                          className="shrink-0"
                        >
                          {block.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-indigo-500 transition" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', block.completed && 'line-through opacity-60')}>
                            {block.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {subject && (
                              <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: subject.color }}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: subject.color }} />
                                {subject.name}
                              </span>
                            )}
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {formatTime(block.startTime)} – {formatTime(block.endTime)}
                            </span>
                          </div>
                        </div>

                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0', priorityConf.bg, priorityConf.text)}>
                          {priorityConf.label}
                        </span>

                        <button
                          onClick={() => {
                            deleteStudyBlock(block.id);
                            window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'Study block removed', type: 'info' } }));
                          }}
                          className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Tasks for this day */}
          {dayTasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 px-1">
                Tasks ({dayTasks.length})
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {dayTasks.map((task) => {
                    const priorityConf = PRIORITY_CONFIG[task.priority];
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl border bg-[hsl(var(--card))] p-4 transition-all',
                          task.completed
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'
                        )}
                      >
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-indigo-500 transition" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', task.completed && 'line-through opacity-60')}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <span className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0',
                          'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                        )}>
                          {task.category}
                        </span>

                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0', priorityConf.bg, priorityConf.text)}>
                          {priorityConf.label}
                        </span>

                        <button
                          onClick={() => {
                            deleteTask(task.id);
                            window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'Task removed', type: 'info' } }));
                          }}
                          className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalItems === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="Nothing planned"
              description="Add study blocks or tasks to this day to start planning your study sessions."
              actionLabel="Add Item"
              onAction={() => setShowAddModal(true)}
            />
          )}
        </div>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal
            date={dateStr}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name, color: s.color }))}
            onClose={() => setShowAddModal(false)}
            onAddStudyBlock={handleAddStudyBlock}
            onAddTask={handleAddTask}
          />
        )}
      </AnimatePresence>
    </>
  );
}
