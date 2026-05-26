'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Variants } from "framer-motion";
import { format, subDays } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Target,
  RotateCcw,
  Flame,
  CheckSquare,
  ArrowRight,
  BookOpen,
  Clock,
  Calendar,
  Timer,
} from 'lucide-react';

import { useSubjectsStore } from '@/store/subjects-store';
import { usePlannerStore } from '@/store/planner-store';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { useExamsStore } from '@/store/exams-store';

import { ProgressRing } from '@/components/shared/progress-ring';
import { StatCard } from '@/components/shared/stat-card';
import { ExamTimer } from '@/components/shared/exam-timer';
import { PageHeader } from '@/components/shared/page-header';

import { useHydration } from '@/hooks/use-hydration';
import {
  cn,
  getToday,
  getStreakCount,
  formatDate,
  getRelativeDate,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/utils';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.3,
    },
  },
} satisfies Variants;
// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Study hard what interests you the most in the most undisciplined way.", author: "Richard Feynman" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
];

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000); // changes daily
  return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
}

function getEncouragement(completionPercent: number, streak: number): string {
  if (streak >= 7) return "🔥 Incredible streak! You're unstoppable!";
  if (streak >= 3) return "💪 Great consistency! Keep the momentum going!";
  if (completionPercent >= 80) return "🌟 Almost there! You're doing amazing work!";
  if (completionPercent >= 50) return "👏 Halfway through — you're making solid progress!";
  if (completionPercent >= 20) return "🚀 Great start! Every topic counts!";
  return "✨ Every journey starts with a single step. You've got this!";
}

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-lg text-xs">
      <p className="font-medium">{label}</p>
      <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
        {payload[0].value} min studied
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const hydrated = useHydration();

  const subjects = useSubjectsStore((s) => s.subjects);
  const tasks = useTasksStore((s) => s.tasks);
  const activities = useActivityStore((s) => s.activities);
  const dailyLogs = useActivityStore((s) => s.dailyLogs);

  const { exams, fetchExams } = useExamsStore();

  // Fetch exams on load
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  // All topics flattened
  const allTopics = useMemo(
    () => subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics)),
    [subjects]
  );

  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter(
    (t) => t.status === 'completed' || t.status === 'revised'
  ).length;
  const revisedTopics = allTopics.filter((t) => t.status === 'revised').length;

  const overallCompletion =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const revisionProgress =
    completedTopics > 0
      ? Math.round((revisedTopics / completedTopics) * 100)
      : 0;

  const streak = useMemo(() => getStreakCount(dailyLogs), [dailyLogs]);

  const today = getToday();
  const tasksDueToday = useMemo(
    () => tasks.filter((t) => !t.completed && t.date === today).length,
    [tasks, today]
  );

  // Time studied today
  const todayLog = dailyLogs.find((l) => l.date === today);
  const todayMinutes = todayLog?.studyMinutes ?? 0;
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;
  const timeStudiedDisplay = `${todayHours}h ${todayMins.toString().padStart(2, '0')}m`;

  // Subject progress cards data
  const subjectProgress = useMemo(
    () =>
      subjects.map((s) => {
        const topics = s.chapters.flatMap((c) => c.topics);
        const total = topics.length;
        const completed = topics.filter(
          (t) => t.status === 'completed' || t.status === 'revised'
        ).length;
        return {
          id: s.id,
          name: s.name,
          color: s.color,
          icon: s.icon,
          total,
          completed,
          percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }),
    [subjects]
  );

  // Weekly chart data (last 7 days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = dailyLogs.find((l) => l.date === dateStr);
      data.push({
        day: format(date, 'EEE'),
        minutes: log?.studyMinutes ?? 0,
      });
    }
    return data;
  }, [dailyLogs]);

  // Upcoming tasks (max 5, incomplete, sorted by due date)
  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed && t.date)
        .sort((a, b) => (a.date! > b.date! ? 1 : -1))
        .slice(0, 5),
    [tasks]
  );

  // Recent activities (max 6)
  const recentActivities = useMemo(
    () => activities.slice(0, 6),
    [activities]
  );

  // Next upcoming exam
  const nextExam = useMemo(() => {
    const upcoming = exams.filter(e => !e.completed).sort((a, b) => a.date > b.date ? 1 : -1);
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [exams]);

  const daysToNextExam = useMemo(() => {
    if (!nextExam) return null;
    const diff = new Date(nextExam.date).getTime() - new Date(today).getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }, [nextExam, today]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[hsl(var(--muted-foreground))] animate-pulse text-sm">
          Loading...
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8 lg:space-y-10 pb-12 sm:pb-16"
    >
      {/* ---- Header + Quote ---- */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Dashboard"
          description={`${getGreeting()}! Here's your study overview.`}
        />
      </motion.div>

      {/* ---- Upcoming Exam Widget ---- */}
      {nextExam && (
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4 sm:p-5 shadow-sm">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-indigo-500 flex items-center gap-2 mb-1">
                    Upcoming {nextExam.type === 'exam' ? 'University Exam' : 'Unit Test'}
                  </h3>
                  <p className="text-xl font-bold">{nextExam.title}</p>
                  <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mt-1">
                    Tentative Start: {formatDate(nextExam.date)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <ExamTimer targetDate={nextExam.date} />
                <Link
                  href="/exams"
                  className="px-5 py-2.5 bg-white dark:bg-[hsl(var(--card))] text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center w-full sm:w-auto"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- Motivational Quote ---- */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium italic leading-relaxed">
              "{getDailyQuote().text}"
            </p>
            {getDailyQuote().author && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                — {getDailyQuote().author}
              </p>
            )}
            <p className="text-xs font-medium text-indigo-400 mt-3">
              {getEncouragement(overallCompletion, streak)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---- Top stat cards ---- */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            title="Overall Completion"
            value={`${overallCompletion}%`}
            subtitle={`${completedTopics} / ${totalTopics} topics`}
            icon={Target}
            color="#6366f1"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Revision Progress"
            value={`${revisionProgress}%`}
            subtitle={`${revisedTopics} revised`}
            icon={RotateCcw}
            color="#8b5cf6"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Daily Streak"
            value={streak}
            subtitle={streak === 1 ? '1 day' : `${streak} days`}
            icon={Flame}
            color="#f97316"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Tasks Due Today"
            value={tasksDueToday}
            subtitle={tasksDueToday === 1 ? '1 task remaining' : `${tasksDueToday} tasks remaining`}
            icon={CheckSquare}
            color="#22c55e"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Studied Today"
            value={timeStudiedDisplay}
            subtitle="Logged in planner"
            icon={Timer}
            color="#14b8a6"
          />
        </motion.div>
      </motion.div>

      {/* ---- Subject Progress Cards ---- */}
      {subjectProgress.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Subject Progress</h2>
            <Link
              href="/subjects"
              className="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {subjectProgress.map((sp) => (
              <motion.div key={sp.id} variants={itemVariants}>
                <Link href="/subjects">
                  <div className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all hover:border-[hsl(var(--ring))] hover:shadow-md">
                    {/* Accent glow */}
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ background: sp.color }}
                    />

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${sp.color}20` }}
                      >
                        <BookOpen className="w-4 h-4" style={{ color: sp.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{sp.name}</p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          {sp.completed}/{sp.total} topics
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          Progress
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: sp.color }}>
                          {sp.percent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: sp.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${sp.percent}%` }}
                          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ---- Middle section: Chart + Upcoming Tasks ---- */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
      >
        {/* Weekly Productivity Chart */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Weekly Productivity</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Study minutes over the last 7 days
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
            </div>

            <div className="h-[220px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    dx={-5}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#chartGradient)"
                    dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Upcoming Tasks</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  Your next deadlines
                </p>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckSquare className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  No upcoming tasks. Enjoy your free time!
                </p>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {upcomingTasks.map((task) => {
                  const priorityConf =
                    PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 transition-colors hover:bg-[hsl(var(--muted))]"
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          priorityConf?.bg
                        )}
                        style={{ background: priorityConf?.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.date && (
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {getRelativeDate(task.date)}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                          priorityConf?.bg,
                          priorityConf?.text
                        )}
                      >
                        {priorityConf?.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ---- Recent Activity ---- */}
      <motion.div variants={itemVariants}>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Your latest study actions
              </p>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-sm font-medium">No activity yet</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Start studying to see your progress here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentActivities.map((activity, idx) => {
                const isLast = idx === recentActivities.length - 1;
                const timeAgo = getRelativeDate(
                  activity.timestamp.split('T')[0]
                );
                return (
                  <div key={activity.id} className="flex gap-3 group">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center pt-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-[hsl(var(--card))]"
                        style={{
                          background: activity.color || '#6366f1',
                        }}
                      />
                      {!isLast && (
                        <div className="w-px flex-1 bg-[hsl(var(--border))] mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={cn('pb-4', isLast && 'pb-0')}>
                      <p className="text-sm leading-snug">{activity.description}</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
