'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import confetti from 'canvas-confetti';

import { usePlannerStore } from '@/store/planner-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { useTimerStore, type ActiveTimerTarget } from '@/store/timer-store';
import { useHydration } from '@/hooks/use-hydration';
import { useToday } from '@/hooks/use-today';
import { calculateDayStudyMetrics } from '@/lib/study-analytics';

import { FocusTimerCard } from '@/components/planner/timer/focus-timer-card';
import { StudyLogsSection } from '@/components/planner/sections/study-logs-section';
import { DailySummarySection } from '@/components/planner/sections/daily-summary-section';
import { TasksSection } from '@/components/planner/sections/tasks-section';

import { AddTaskModal } from '@/components/planner/modals/add-task-modal';
import { LogStudyTimeModal } from '@/components/planner/modals/log-study-time-modal';
import { EditTaskModal } from '@/components/planner/modals/edit-task-modal';
import { EditStudyLogModal } from '@/components/planner/modals/edit-study-log-modal';
import { TimerConflictModal } from '@/components/planner/modals/timer-conflict-modal';
import { ConfirmModal } from '@/components/shared/confirm-modal';

import type { Task, StudyBlock } from '@/types';

function DayflowContent() {
  const hydrated = useHydration();
  const today = useToday();

  // Stores
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasksStore();
  const { studyBlocks, addStudyBlock, updateStudyBlock, deleteStudyBlock } = usePlannerStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  const { dailyLogs, addStudySession, removeStudySession, addActivity } = useActivityStore();

  const {
    isMainRunning,
    mainSeconds,
    activeTarget,
    startTargetSession,
    resetMain,
    segmentStartTime,
  } = useTimerStore();

  // Modals state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingBlock, setEditingBlock] = useState<StudyBlock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'task' | 'block';
    id: string;
  } | null>(null);

  // Timer Conflict Dialog state
  const [pendingTimerTarget, setPendingTimerTarget] = useState<ActiveTimerTarget | null>(null);

  // Today's sessions from dailyLogs
  const todayLog = useMemo(() => dailyLogs.find((l) => l.date === today), [dailyLogs, today]);
  const todaySessions = useMemo(() => todayLog?.sessions || [], [todayLog]);

  // Compute daily metrics across tasks, timer sessions, and retrospective study blocks
  const metrics = useMemo(() => {
    return calculateDayStudyMetrics({
      date: today,
      studyBlocks,
      sessions: todaySessions,
      tasks,
    });
  }, [today, studyBlocks, todaySessions, tasks]);

  // Confetti when all tasks completed
  const [prevAllDone, setPrevAllDone] = useState(false);
  const allTasksDone = tasks.length > 0 && tasks.every((t) => t.completed);

  useEffect(() => {
    if (allTasksDone && !prevAllDone) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    setPrevAllDone(allTasksDone);
  }, [allTasksDone, prevAllDone]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // Direct Task Toggle (does not create artificial focus sessions)
  const handleToggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const nextCompleted = !task.completed;
      await updateTask(id, {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : null,
      });

      if (nextCompleted) {
        await addActivity({
          type: 'task-completed',
          description: `Completed "${task.title}"`,
          color: '#22c55e',
        });
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: `Completed "${task.title}"! 🎉`, type: 'success' } })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: `Reopened "${task.title}"`, type: 'info' } })
        );
      }
    },
    [tasks, updateTask, addActivity]
  );

  // START FOCUS HANDLER with conflict detection
  const handleStartFocus = useCallback(
    (target: ActiveTimerTarget) => {
      if (isMainRunning && activeTarget?.id !== target.id) {
        setPendingTimerTarget(target);
        return;
      }
      startTargetSession(target);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `Started focus session for "${target.title}"!`, type: 'success' },
        })
      );
    },
    [isMainRunning, activeTarget, startTargetSession]
  );

  const handleSaveAndSwitchTimer = useCallback(() => {
    if (!pendingTimerTarget) return;

    // Save current session
    const now = new Date();
    const sessionDate = today;
    const diffMins = Math.max(1, Math.round(mainSeconds / 60));

    if (segmentStartTime && diffMins > 0) {
      addStudySession(sessionDate, {
        startTime: segmentStartTime,
        endTime: now.toISOString(),
        durationMinutes: diffMins,
        type:
          activeTarget?.type === 'task'
            ? 'task'
            : activeTarget?.type === 'study-block'
            ? 'study-block'
            : 'timer',
        title: activeTarget?.title || 'Stopwatch Session',
        taskId: activeTarget?.taskId,
        studyBlockId: activeTarget?.studyBlockId,
      });
    }

    startTargetSession(pendingTimerTarget);
    setPendingTimerTarget(null);

    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          message: `Saved previous session and started focus for "${pendingTimerTarget.title}"!`,
          type: 'success',
        },
      })
    );
  }, [pendingTimerTarget, today, mainSeconds, segmentStartTime, activeTarget, addStudySession, startTargetSession]);

  const handleDiscardAndSwitchTimer = useCallback(() => {
    if (!pendingTimerTarget) return;
    resetMain();
    startTargetSession(pendingTimerTarget);
    setPendingTimerTarget(null);
  }, [pendingTimerTarget, resetMain, startTargetSession]);

  // DELETE EXECUTOR
  const handleExecuteDelete = useCallback(async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'task') {
      await deleteTask(confirmDelete.id);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Task deleted', type: 'info' } })
      );
    } else if (confirmDelete.type === 'block') {
      await deleteStudyBlock(confirmDelete.id);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Study log deleted', type: 'info' } })
      );
    }

    setConfirmDelete(null);
  }, [confirmDelete, deleteTask, deleteStudyBlock]);

  if (!hydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-2xl bg-[hsl(var(--muted))]" />
        <div className="h-64 w-full rounded-3xl bg-[hsl(var(--muted))]" />
        <div className="h-48 w-full rounded-3xl bg-[hsl(var(--muted))]" />
        <div className="h-28 w-full rounded-2xl bg-[hsl(var(--muted))]" />
        <div className="h-64 w-full rounded-3xl bg-[hsl(var(--muted))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
            Daily Planner
          </h1>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Single-page focus timer, study logs, daily metrics, and task management
          </p>
        </div>
      </div>

      {/* 1. FOCUS TIMER (Prominently displayed near top) */}
      <FocusTimerCard
        date={today}
        todayActualMinutes={metrics.actualStudyMinutes}
      />

      {/* 2. STUDY BLOCKS / STUDY LOGS SECTION */}
      <StudyLogsSection
        studyBlocks={studyBlocks}
        tasks={tasks}
        subjects={subjects}
        dailyLogs={dailyLogs}
        todayStr={today}
        onOpenLogModal={() => setShowLogModal(true)}
        onEditBlock={(block) => setEditingBlock(block)}
        onDeleteBlock={(id) => setConfirmDelete({ type: 'block', id })}
        onStartFocus={handleStartFocus}
      />

      {/* 3. DAILY SUMMARY CARDS */}
      <DailySummarySection
        completedTasksCount={metrics.completedTasksCount}
        totalTasksTodayCount={metrics.totalTasksTodayCount}
        pendingTasksCount={metrics.pendingTasksCount}
        studyLogsCount={metrics.studyLogsCount}
        manualLogMinutes={metrics.rawManualMinutes}
        actualStudyMinutes={metrics.actualStudyMinutes}
        overlappingMinutes={metrics.overlappingMinutes}
      />

      {/* 4. TASKS SECTION */}
      <div id="tasks">
        <TasksSection
          tasks={tasks}
          todayStr={today}
          onOpenAddTaskModal={() => setShowAddTaskModal(true)}
          onToggleTask={handleToggleTask}
          onEditTask={(task) => setEditingTask(task)}
          onDeleteTask={(id) => setConfirmDelete({ type: 'task', id })}
          onStartFocus={handleStartFocus}
        />
      </div>

      {/* Modal: Add Task */}
      <AddTaskModal
        open={showAddTaskModal}
        initialDate={today}
        onClose={() => setShowAddTaskModal(false)}
        onAddTask={addTask}
      />

      {/* Modal: Log Study Time (Retrospective) */}
      <LogStudyTimeModal
        open={showLogModal}
        initialDate={today}
        subjects={subjects}
        tasks={tasks}
        sessions={todaySessions}
        onClose={() => setShowLogModal(false)}
        onAddStudyLog={addStudyBlock}
      />

      {/* Modal: Edit Task */}
      <EditTaskModal
        open={editingTask !== null}
        task={editingTask}
        onClose={() => setEditingTask(null)}
      />

      {/* Modal: Edit Study Log */}
      <EditStudyLogModal
        block={editingBlock}
        subjects={subjects}
        tasks={tasks}
        onClose={() => setEditingBlock(null)}
        onSave={(id, updates) => updateStudyBlock(id, updates)}
      />

      {/* Modal: Timer Conflict Guard */}
      {pendingTimerTarget && (
        <TimerConflictModal
          isOpen={pendingTimerTarget !== null}
          currentTarget={activeTarget}
          newTarget={pendingTimerTarget}
          elapsedSeconds={mainSeconds}
          onCancel={() => setPendingTimerTarget(null)}
          onSaveAndSwitch={handleSaveAndSwitchTimer}
          onDiscardAndSwitch={handleDiscardAndSwitchTimer}
        />
      )}

      {/* Modal: Confirmation for Deletion */}
      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleExecuteDelete}
        title={confirmDelete?.type === 'task' ? 'Delete Task' : 'Delete Study Log'}
        message={
          confirmDelete?.type === 'task'
            ? 'Are you sure you want to delete this task? This action cannot be undone.'
            : 'Are you sure you want to delete this study log record?'
        }
        confirmText="Delete"
      />
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
          <div className="h-12 w-64 rounded-2xl bg-[hsl(var(--muted))]" />
          <div className="h-64 w-full rounded-3xl bg-[hsl(var(--muted))]" />
          <div className="h-48 w-full rounded-3xl bg-[hsl(var(--muted))]" />
          <div className="h-28 w-full rounded-2xl bg-[hsl(var(--muted))]" />
          <div className="h-64 w-full rounded-3xl bg-[hsl(var(--muted))]" />
        </div>
      }
    >
      <DayflowContent />
    </Suspense>
  );
}
