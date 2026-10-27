'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import {
  Activity, ArrowDownWideNarrow, ArrowRight, Atom, BookOpen, Calculator,
  CalendarDays, Check, CheckCircle2, CheckSquare, Clock3, Code, Compass,
  Flame, FlaskConical, Globe, GraduationCap, Languages, Lightbulb, ListTodo,
  Microscope, Music, Palette, PenTool, Play, RotateCcw, Scale, Settings2,
  Target, TriangleAlert, Brain,
  type LucideIcon,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useSubjectsStore } from '@/store/subjects-store';
import { usePlannerStore } from '@/store/planner-store';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { useExamsStore } from '@/store/exams-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import { useHydration } from '@/hooks/use-hydration';
import { useToday } from '@/hooks/use-today';
import { calculateDayStudyMetrics, formatDurationHuman } from '@/lib/study-analytics';
import { getRelativeDate, getStreakCount, PRIORITY_CONFIG } from '@/lib/utils';
import { getSubjectDisplayName } from '@/lib/subject-display';
import { plannerTasksHref, subjectDetailHref } from '@/lib/routes';
import { AddTaskModal } from '@/components/planner/modals/add-task-modal';
import { EditTaskModal } from '@/components/planner/modals/edit-task-modal';
import { PageLoader, SectionLoader, Skeleton } from '@/components/ui/loading';
import type { Task, Topic } from '@/types';

type SubjectSort = 'attention' | 'completion' | 'remaining' | 'revisions' | 'activity';

const surface = 'rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function timeAgo(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
}

function activityDateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : `${timeAgo(value)} · ${format(date, 'MMM d, h:mm a')}`;
}

function IconForSubject({ name, color }: { name: string; color: string }) {
  const iconMap: Record<string, LucideIcon> = {
    BookOpen, Calculator, Atom, Globe, Code, Palette, Music, FlaskConical,
    Scale, Languages, Brain, Lightbulb, GraduationCap, Microscope, Compass, PenTool,
  };
  const Icon = iconMap[name] || BookOpen;
  return <Icon className="h-4 w-4" style={{ color }} aria-hidden="true" />;
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload?: { recorded?: boolean } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-[hsl(var(--muted-foreground))]">{payload[0].payload?.recorded ? formatDurationHuman(payload[0].value) : 'No study log recorded'}</p>
    </div>
  );
}

export default function DashboardPage() {
  const hydrated = useHydration();
  const today = useToday();
  const { subjects, isLoading: subjectsLoading } = useSubjectsStore();
  const { tasks, isLoading: tasksLoading, addTask, updateTask } = useTasksStore();
  const { studyBlocks, isLoading: blocksLoading } = usePlannerStore();
  const { activities, isLoadingActivities: activitiesLoading, dailyLogs, isLoadingDailyLogs: logsLoading, addActivity } = useActivityStore();
  const { exams, fetchExams } = useExamsStore();
  const { settings } = useSettingsStore();
  const { isMainRunning, mainSeconds, activeTarget, startTargetSession, toggleMain } = useTimerStore();
  const [subjectSort, setSubjectSort] = useState<SubjectSort>('attention');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => { void fetchExams(); }, [fetchExams]);

  const allTopics = useMemo(() => subjects.flatMap((subject) => subject.chapters.flatMap((chapter) =>
    chapter.topics.map((topic) => ({ ...topic, subjectId: subject.id, subjectName: subject.name, subjectColor: subject.color, chapterName: chapter.name }))
  )), [subjects]);
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter((topic) => topic.status === 'completed' || topic.status === 'revised').length;
  const completionPercent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const streak = useMemo(() => getStreakCount(dailyLogs), [dailyLogs]);

  const todayLog = dailyLogs.find((log) => log.date === today);
  const todaySessions = useMemo(() => todayLog?.sessions || [], [todayLog]);
  const todayMetrics = useMemo(() => calculateDayStudyMetrics({ date: today, studyBlocks, sessions: todaySessions, tasks }), [today, studyBlocks, todaySessions, tasks]);
  const studyMinutes = todayMetrics.actualStudyMinutes;
  const goalMinutes = Math.max(0, Number(settings.dailyStudyGoalHours) || 0) * 60;
  const goalPercent = goalMinutes ? Math.min(100, Math.round((studyMinutes / goalMinutes) * 100)) : 0;
  const focusTasks = useMemo(() => tasks.filter((task) => !task.completed && task.date === today), [tasks, today]);
  const completedToday = useMemo(() => tasks.filter((task) => task.completed && task.completedAt?.slice(0, 10) === today).length, [tasks, today]);
  const finishedFocusTasks = useMemo(() => tasks.filter((task) => task.completed && task.date === today), [tasks, today]);
  const recentActivities = useMemo(() => {
    const seen = new Set<string>();
    return [...activities].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).filter((activity) => {
      const key = `${activity.type}:${activity.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }, [activities]);

  const blockByTaskId = useMemo(() => {
    const map = new Map<string, (typeof studyBlocks)[number]>();
    studyBlocks.forEach((block) => {
      const taskId = block.taskId || block.task_id;
      if (taskId && !map.has(taskId)) map.set(taskId, block);
    });
    return map;
  }, [studyBlocks]);
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const subjectForTask = (task: Task) => {
    const block = blockByTaskId.get(task.id);
    return block ? subjectById.get(block.subjectId) : undefined;
  };

  const revisionQueue = useMemo(() => allTopics.filter((topic) =>
    (topic.status === 'completed' || topic.status === 'revised') && topic.revisionCount > 0 && topic.nextRevisionDue && topic.nextRevisionDue <= today
  ).sort((a, b) => (a.nextRevisionDue || '').localeCompare(b.nextRevisionDue || '')).map((topic) => ({ kind: 'revision' as const, topic })), [allTopics, today]);
  const overdueTasks = useMemo(() => tasks.filter((task) => !task.completed && task.date && task.date < today).sort((a, b) => a.date.localeCompare(b.date)), [tasks, today]);
  const upcomingTasks = useMemo(() => tasks.filter((task) => !task.completed && task.date && task.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (['urgent', 'high', 'medium', 'low'].indexOf(a.priority) - ['urgent', 'high', 'medium', 'low'].indexOf(b.priority))).slice(0, 5), [tasks, today]);

  const subjectProgress = useMemo(() => {
    const recentSubjectIds = new Map<string, number>();
    activities.forEach((activity) => {
      if (activity.subjectId) recentSubjectIds.set(activity.subjectId, Math.max(recentSubjectIds.get(activity.subjectId) || 0, new Date(activity.timestamp).getTime() || 0));
    });
    dailyLogs.flatMap((log) => log.sessions || []).forEach((session) => {
      if (session.studyBlockId) {
        const block = studyBlocks.find((entry) => entry.id === session.studyBlockId);
        if (block) recentSubjectIds.set(block.subjectId, Math.max(recentSubjectIds.get(block.subjectId) || 0, new Date(session.endTime).getTime()));
      }
    });
    return subjects.map((subject) => {
      const topics = subject.chapters.flatMap((chapter) => chapter.topics);
      const done = topics.filter((topic) => topic.status === 'completed' || topic.status === 'revised').length;
      const dueRevisions = topics.filter((topic) => (topic.status === 'completed' || topic.status === 'revised') && topic.revisionCount > 0 && topic.nextRevisionDue && topic.nextRevisionDue <= today).length;
      const remaining = topics.length - done;
      return { subject, total: topics.length, done, remaining, dueRevisions, percent: topics.length ? Math.round(done / topics.length * 100) : 0, lastStudied: recentSubjectIds.get(subject.id) || 0 };
    }).sort((a, b) => {
      if (subjectSort === 'completion') return b.percent - a.percent;
      if (subjectSort === 'remaining') return b.remaining - a.remaining;
      if (subjectSort === 'revisions') return b.dueRevisions - a.dueRevisions;
      if (subjectSort === 'activity') return b.lastStudied - a.lastStudied;
      return (b.dueRevisions - a.dueRevisions) || (b.remaining - a.remaining);
    });
  }, [subjects, today, subjectSort, dailyLogs, studyBlocks, activities]);

  const chartData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(`${today}T12:00:00`), 6 - index);
    const dateKey = format(date, 'yyyy-MM-dd');
    const log = dailyLogs.find((entry) => entry.date === dateKey);
    const metrics = calculateDayStudyMetrics({ date: dateKey, studyBlocks, sessions: log?.sessions || [], tasks });
    return { date: dateKey, day: format(date, 'EEE'), minutes: metrics.actualStudyMinutes, recorded: Boolean(log || studyBlocks.some((block) => block.date === dateKey)) };
  }), [today, dailyLogs, studyBlocks, tasks]);
  const weeklyTotal = chartData.reduce((sum, day) => sum + day.minutes, 0);
  const activeDays = chartData.filter((day) => day.minutes > 0).length;
  const hasWeeklyHistory = chartData.some((day) => day.minutes > 0);

  const attentionItems = useMemo(() => [
    ...overdueTasks.map((task) => ({ key: `task-${task.id}`, title: task.title, detail: `Overdue · ${getRelativeDate(task.date)}`, href: plannerTasksHref(), urgent: true, task })),
    ...revisionQueue.map(({ topic }) => ({ key: `revision-${topic.id}`, title: topic.name, detail: `${topic.subjectName} · ${topic.nextRevisionDue === today ? 'Revision due today' : `Overdue · ${getRelativeDate(topic.nextRevisionDue || today)}`}`, href: `/revisions/${topic.subjectId}`, urgent: topic.nextRevisionDue !== today, task: undefined })),
  ].slice(0, 5), [overdueTasks, revisionQueue, today]);

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) || subjects[0];
  const selectableTopics = selectedSubject?.chapters.flatMap((chapter) => chapter.topics) || [];
  const selectedTopic: Topic | undefined = selectableTopics.find((topic) => topic.id === selectedTopicId) || selectableTopics.find((topic) => topic.status !== 'completed' && topic.status !== 'revised') || selectableTopics[0];
  const nextExam = [...exams].filter((exam) => !exam.completed && exam.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  const startStudying = () => {
    if (!selectedSubject) return;
    if (isMainRunning) return;
    if (activeTarget && activeTarget.title && mainSeconds > 0) {
      toggleMain();
      return;
    }
    const title = selectedTopic ? `${selectedSubject.name} · ${selectedTopic.name}` : selectedSubject.name;
    startTargetSession({ type: 'general', id: selectedTopic?.id || selectedSubject.id, title, subjectId: selectedSubject.id });
  };

  const startTaskSession = (task: Task) => {
    const target = { type: 'task' as const, id: task.id, taskId: task.id, title: task.title, subjectId: subjectForTask(task)?.id };
    if (isMainRunning) {
      window.location.assign(plannerTasksHref());
      return;
    }
    if (activeTarget?.taskId === task.id && mainSeconds > 0) toggleMain();
    else startTargetSession(target);
  };

  const toggleComplete = async (task: Task) => {
    const completed = !task.completed;
    await updateTask(task.id, { completed, completedAt: completed ? new Date().toISOString() : null });
    if (completed) {
      await addActivity({ type: 'task-completed', description: `Completed "${task.title}"`, color: '#22c55e' });
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Completed “${task.title}”`, type: 'success' } }));
    }
  };

  if (!hydrated) return <PageLoader label="Loading your dashboard" />;

  return (
    <div className="w-full space-y-6 pb-10 sm:space-y-8">
      <section className="flex flex-col gap-4 border-b border-[hsl(var(--border))] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium text-indigo-400"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{dateLabel(today)}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()}</h1>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{focusTasks.length ? `${focusTasks.length} task${focusTasks.length === 1 ? '' : 's'} planned today. Let’s make the first one count.` : 'A clear plan makes it easier to begin. Choose a subject and start a focus session.'}</p>
        </div>
        <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
            <div className="min-w-[130px] flex-1 sm:w-44 xl:w-48 sm:flex-none">
              <label htmlFor="start-subject" className="sr-only">Choose a subject</label>
              <select id="start-subject" value={selectedSubject?.id || ''} onChange={(event) => { setSelectedSubjectId(event.target.value); setSelectedTopicId(''); }} className={`h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs ${focusRing}`}>
                <option value="">Choose subject</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{getSubjectDisplayName(subject)}</option>)}
              </select>
            </div>
            <div className="min-w-[130px] flex-1 sm:w-44 xl:w-48 sm:flex-none">
              <label htmlFor="start-topic" className="sr-only">Choose a topic</label>
              <select id="start-topic" value={selectedTopic?.id || ''} onChange={(event) => setSelectedTopicId(event.target.value)} disabled={!selectableTopics.length} className={`h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-xs disabled:opacity-50 ${focusRing}`}>
                <option value="">{selectableTopics.length ? 'Choose topic' : 'No topics'}</option>
                {selectableTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </div>
            <button type="button" onClick={startStudying} disabled={!selectedSubject || isMainRunning} className={`inline-flex h-10 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}>
              <Play className="h-4 w-4 shrink-0" />{isMainRunning ? 'Session running' : activeTarget && mainSeconds > 0 ? 'Resume session' : 'Start studying'}
            </button>
          </div>
          <Link href="/planner" className={`${focusRing} text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]`}>{isMainRunning ? `Manage ${activeTarget?.title || 'current session'} · ${formatDurationHuman(Math.floor(mainSeconds / 60))}` : 'Open study planner'} <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
        </div>
      </section>

      {nextExam && <Link href="/exams" className={`${surface} ${focusRing} flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:border-indigo-400/50`}><span className="flex items-center gap-2 text-sm font-medium"><GraduationCap className="h-4 w-4 text-indigo-400" />Next exam: {nextExam.title}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{getRelativeDate(nextExam.date)} <ArrowRight className="ml-1 inline h-3 w-3" /></span></Link>}

      <section className={`${surface} overflow-hidden border-indigo-500/25`} aria-labelledby="focus-heading">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)]">
          <div className="p-4 sm:p-6">
            <SectionHeading title="Today's Focus" subtitle="Your planned work, ready when you are." action={<button type="button" onClick={() => setShowAddTask(true)} className={`${focusRing} inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-medium hover:bg-[hsl(var(--muted))]`}><ListTodo className="h-3.5 w-3.5" />Add task</button>} />
            <h2 id="focus-heading" className="sr-only">Today&apos;s Focus</h2>
            {tasksLoading ? <SectionLoader rows={3} /> : focusTasks.length || finishedFocusTasks.length ? <div className="space-y-2">
              {[...focusTasks, ...finishedFocusTasks].slice(0, 6).map((task) => {
                const subject = subjectForTask(task);
                const isActive = activeTarget?.taskId === task.id || (activeTarget?.type === 'task' && activeTarget.id === task.id);
                const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                return <div key={task.id} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${isActive ? 'border-indigo-500/35 bg-indigo-500/5' : 'border-[hsl(var(--border))] bg-[hsl(var(--background))]'}`}>
                  <button type="button" onClick={() => void toggleComplete(task)} aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`${focusRing} flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${task.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[hsl(var(--border))] text-transparent hover:border-emerald-500 hover:text-emerald-500'}`}><Check className="h-3.5 w-3.5" /></button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${task.completed ? 'text-[hsl(var(--muted-foreground))] line-through' : ''}`}>{task.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                      {subject && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />{getSubjectDisplayName(subject)}</span>}
                      {!subject && <span className="capitalize">{task.category.replace('-', ' ')}</span>}
                      {task.estimatedMinutes && <span>{task.estimatedMinutes} min</span>}
                      <span>{task.completed ? 'Completed' : isActive ? 'In progress' : 'Up next'}</span>
                    </p>
                  </div>
                  {!task.completed && <span className="hidden rounded-md px-2 py-1 text-[10px] font-semibold uppercase sm:inline" style={{ color: priority?.color, backgroundColor: `${priority?.color || '#94a3b8'}18` }}>{priority?.label || task.priority}</span>}
                  {!task.completed && <button type="button" onClick={() => startTaskSession(task)} className={`${focusRing} rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20`}>{isActive ? 'Active' : activeTarget?.taskId === task.id && !isMainRunning ? 'Resume' : 'Start'}</button>}
                  {!task.completed && <button type="button" onClick={() => setEditingTask(task)} className={`${focusRing} rounded-lg p-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]`} aria-label={`Open ${task.title}`}>Open</button>}
                </div>;
              })}
            </div> : <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
              <p className="mt-2 text-sm font-medium">No tasks scheduled for today</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Add a task to give your next study session a clear finish line.</p>
              <button type="button" onClick={() => setShowAddTask(true)} className={`${focusRing} mt-3 rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-xs font-medium hover:bg-[hsl(var(--muted))]/70`}>Schedule a task</button>
            </div>}
            <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">{finishedFocusTasks.length} of {finishedFocusTasks.length + focusTasks.length} scheduled tasks complete</span>
              <Link href={plannerTasksHref()} className={`${focusRing} font-medium text-indigo-400 hover:text-indigo-300`}>All tasks <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
            </div>
          </div>
          <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/45 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">DAILY STUDY GOAL</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatDurationHuman(studyMinutes)} <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/ {goalMinutes ? formatDurationHuman(goalMinutes) : 'not set'}</span></p></div>
              <div role="progressbar" aria-label="Daily study goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalMinutes ? goalPercent : 0} className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: goalMinutes ? `conic-gradient(#818cf8 ${goalPercent}%, hsl(var(--muted)) ${goalPercent}% 100%)` : 'hsl(var(--muted))' }}><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--card))]"><span className="text-xs font-semibold tabular-nums">{goalMinutes ? `${goalPercent}%` : '—'}</span></div></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-indigo-400 transition-[width]" style={{ width: `${goalPercent}%` }} /></div>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{goalMinutes ? goalPercent >= 100 ? 'Daily goal reached. Great work.' : `${formatDurationHuman(goalMinutes - studyMinutes)} left to reach your goal` : 'Set your daily target in settings to track goal progress.'}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"><div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><CheckSquare className="h-3.5 w-3.5 text-emerald-400" />Tasks done today</div><p className="mt-1.5 text-lg font-semibold tabular-nums">{completedToday}</p></div>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"><div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Flame className="h-3.5 w-3.5 text-orange-400" />Study streak</div><p className="mt-1.5 text-lg font-semibold tabular-nums">{streak}<span className="ml-1 text-xs font-normal text-[hsl(var(--muted-foreground))]">days</span></p></div>
            </div>
            <Link href="/settings" className={`${focusRing} mt-3 inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]`}><Settings2 className="h-3.5 w-3.5" />Adjust daily goal</Link>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Subject progress" subtitle={`${completedTopics} of ${totalTopics} topics complete · revision work is tracked separately`} action={<label className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><ArrowDownWideNarrow className="h-3.5 w-3.5" /><span className="sr-only">Sort subjects</span><select aria-label="Sort subjects" value={subjectSort} onChange={(event) => setSubjectSort(event.target.value as SubjectSort)} className={`rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-2 text-xs text-[hsl(var(--foreground))] ${focusRing}`}><option value="attention">Needs attention</option><option value="completion">Most complete</option><option value="remaining">Most topics left</option><option value="revisions">Revisions due</option><option value="activity">Recently studied</option></select></label>} />
        {subjectsLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}</div> : subjectProgress.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {subjectProgress.map(({ subject, total, done, remaining, dueRevisions, percent }) => <Link key={subject.id} href={subjectDetailHref(subject.id)} className={`${surface} ${focusRing} group block p-4 transition hover:border-indigo-400/40`}>
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${subject.color}20` }}><IconForSubject name={subject.icon} color={subject.color} /></span><div className="min-w-0"><p className="break-words text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{getSubjectDisplayName(subject)}</p><p className="text-[11px] text-[hsl(var(--muted-foreground))]">{done}/{total} topics</p></div></div><span className="text-sm font-semibold tabular-nums" style={{ color: subject.color }}>{percent}%</span></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full transition-[width]" style={{ width: `${percent}%`, backgroundColor: subject.color }} /></div>
            <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-[hsl(var(--muted-foreground))]"><span>{remaining} remaining</span><span className={dueRevisions ? 'text-purple-300' : ''}>{dueRevisions ? `${dueRevisions} revision${dueRevisions === 1 ? '' : 's'} due` : 'No revisions due'}</span></div>
          </Link>)}
        </div> : <div className={`${surface} p-6 text-center`}><p className="text-sm font-medium">No subjects yet</p><Link href="/subjects" className={`${focusRing} mt-2 inline-flex items-center gap-1 text-xs text-indigo-400`}>Add subjects <ArrowRight className="h-3 w-3" /></Link></div>}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${surface} p-4 sm:p-5 flex flex-col justify-between`}>
          <SectionHeading title="Needs Attention" subtitle="Overdue tasks and scheduled revisions, ordered by urgency" action={<Link href="/revisions" className={`${focusRing} text-xs text-indigo-400 hover:text-indigo-300`}>Revision queue <ArrowRight className="ml-1 inline h-3 w-3" /></Link>} />
          {tasksLoading || subjectsLoading ? <SectionLoader rows={3} /> : attentionItems.length ? <ul className="space-y-2">{attentionItems.map((item) => <li key={item.key} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.urgent ? 'bg-rose-500/10 text-rose-400' : 'bg-purple-500/10 text-purple-300'}`}>{item.urgent ? <TriangleAlert className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-0.5 truncate text-[11px] text-[hsl(var(--muted-foreground))]">{item.detail}</p></div>
            {item.task && <button type="button" onClick={() => void toggleComplete(item.task!)} className={`${focusRing} rounded-lg border border-[hsl(var(--border))] px-2.5 py-1.5 text-xs hover:bg-[hsl(var(--muted))]`}>Complete</button>}
            <Link href={item.href} aria-label={`Open ${item.title}`} className={`${focusRing} rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]`}><ArrowRight className="h-4 w-4" /></Link>
          </li>)}</ul> : <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-6 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" /><p className="mt-2 text-sm font-medium">You&apos;re up to date</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">No overdue tasks or scheduled revisions need attention.</p></div>}
        </div>
        <div className={`${surface} p-4 sm:p-5 flex flex-col justify-between`}>
          <SectionHeading title="Upcoming tasks" subtitle="Next deadlines, with higher priority first" action={<Link href={plannerTasksHref()} className={`${focusRing} text-xs text-indigo-400 hover:text-indigo-300`}>All tasks <ArrowRight className="ml-1 inline h-3 w-3" /></Link>} />
          {tasksLoading ? <SectionLoader rows={3} /> : upcomingTasks.length ? <ul className="space-y-2">{upcomingTasks.map((task) => {
            const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
            const subject = subjectForTask(task);
            return <li key={task.id} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-3"><button type="button" onClick={() => void toggleComplete(task)} aria-label={`Complete ${task.title}`} className={`${focusRing} h-5 w-5 shrink-0 rounded-full border border-[hsl(var(--border))] hover:border-emerald-400`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-0.5 truncate text-[11px] text-[hsl(var(--muted-foreground))]">{subject ? `${getSubjectDisplayName(subject)} · ` : ''}{getRelativeDate(task.date)}{task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ''}</p></div><span className="rounded px-2 py-1 text-[10px] font-semibold uppercase" style={{ color: priority?.color, backgroundColor: `${priority?.color || '#94a3b8'}18` }}>{priority?.label || task.priority}</span><button type="button" onClick={() => setEditingTask(task)} aria-label={`Edit ${task.title}`} className={`${focusRing} rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]`}><ArrowRight className="h-4 w-4" /></button></li>;
          })}</ul> : <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-6 text-center"><CheckSquare className="mx-auto h-6 w-6 text-emerald-400" /><p className="mt-2 text-sm font-medium">No upcoming deadlines</p><button type="button" onClick={() => setShowAddTask(true)} className={`${focusRing} mt-2 text-xs text-indigo-400`}>Schedule a task</button></div>}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${surface} p-4 sm:p-5 flex flex-col justify-between`}>
          <SectionHeading title="Weekly productivity" subtitle="Recorded study time · last 7 days" action={<Link href="/analytics" className={`${focusRing} text-xs text-indigo-400 hover:text-indigo-300`}>Analytics <ArrowRight className="ml-1 inline h-3 w-3" /></Link>} />
          {logsLoading || blocksLoading ? <Skeleton className="h-52 rounded-xl" /> : !hasWeeklyHistory ? <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] text-center"><Activity className="h-6 w-6 text-[hsl(var(--muted-foreground))]" /><p className="mt-2 text-sm font-medium">No study sessions recorded this week</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Start a focus session to see your weekly progress.</p></div> : <>
            <div className="mb-2 flex gap-5 text-xs"><span><strong className="text-sm tabular-nums">{formatDurationHuman(weeklyTotal)}</strong><span className="ml-1 text-[hsl(var(--muted-foreground))]">total</span></span><span><strong className="text-sm tabular-nums">{activeDays}</strong><span className="ml-1 text-[hsl(var(--muted-foreground))]">active days</span></span></div>
            <div className="h-44 w-full sm:h-52"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="dashboardStudyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.28} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} /><YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value: number) => value >= 60 ? `${(value / 60).toFixed(value % 60 ? 1 : 0)}h` : `${value}m`} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="minutes" stroke="#818cf8" strokeWidth={2} fill="url(#dashboardStudyGradient)" activeDot={{ r: 4 }} /></AreaChart></ResponsiveContainer></div>
          </>}
        </div>
        <div className={`${surface} p-4 sm:p-5 flex flex-col justify-between`}>
          <SectionHeading title="Recent activity" subtitle="Latest study milestones and updates" />
          {activitiesLoading ? <SectionLoader rows={4} /> : recentActivities.length ? <ul className="space-y-0.5">{recentActivities.map((activity, index) => <li key={activity.id} className="flex gap-3"><div className="flex flex-col items-center"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-[hsl(var(--card))]" style={{ backgroundColor: activity.color || '#818cf8' }} />{index < recentActivities.length - 1 && <span className="my-1 w-px flex-1 bg-[hsl(var(--border))]" />}</div><div className="min-w-0 pb-3"><p className="text-sm leading-snug">{activity.description}</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{activityDateLabel(activity.timestamp)}</p></div></li>)}</ul> : <div className="rounded-xl border border-dashed border-[hsl(var(--border))] px-4 py-7 text-center"><Clock3 className="mx-auto h-6 w-6 text-[hsl(var(--muted-foreground))]" /><p className="mt-2 text-sm font-medium">No activity recorded yet</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Completed tasks and study milestones will show here.</p></div>}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
        <span><Target className="mr-1.5 inline h-3.5 w-3.5 text-indigo-400" />Syllabus completion: <strong className="text-[hsl(var(--foreground))]">{completionPercent}%</strong> · revisions are scheduled independently from topic completion.</span>
        <Link href="/subjects" className={`${focusRing} font-medium text-indigo-400`}>View syllabus <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
      </div>

      <AddTaskModal open={showAddTask} initialDate={today} onClose={() => setShowAddTask(false)} onAddTask={addTask} />
      <EditTaskModal open={!!editingTask} task={editingTask} onClose={() => setEditingTask(null)} />
    </div>
  );
}
