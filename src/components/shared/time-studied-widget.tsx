'use client';

import { useState, useEffect } from 'react';
import { Timer, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/shared/progress-ring';
import { useActivityStore } from '@/store/activity-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import { useTasksStore } from '@/store/tasks-store';
import { getToday } from '@/lib/utils';

export function TimeStudiedWidget({ date }: { date: string }) {
  const { dailyLogs, updateDailyLog, addStudySession, removeStudySession } = useActivityStore();
  const { settings } = useSettingsStore();
  const updateTask = useTasksStore(s => s.updateTask);
  
  const { 
    isMainRunning, mainSeconds, mainStartTime, toggleMain, resetMain,
    segmentStartTime, lastPauseTime, setSegmentStartTime, setLastPauseTime,
    isPomoRunning, pomoSecondsLeft, pomoMode, togglePomo, resetPomo
  } = useTimerStore();

  const log = dailyLogs.find((l) => l.date === date);
  const totalMinutes = log?.studyMinutes ?? 0;
  const sessions = log?.sessions ?? [];
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const goalMinutes = (settings.dailyStudyGoalHours || 8) * 60;
  const progressPct = Math.min(100, Math.round((totalMinutes / goalMinutes) * 100));
  const isToday = date === getToday();
  const title = isToday
    ? 'Total Time Studied Today'
    : `Time Studied on ${format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}`;
  const subtitle = isToday
    ? `Resets at 12:00 AM • ${settings.dailyStudyGoalHours || 8}h daily goal`
    : `${settings.dailyStudyGoalHours || 8}h daily goal • date-specific progress`;

  // Manual Edit State
  const [editing, setEditing] = useState(false);
  const [inputHours, setInputHours] = useState(String(totalHours));
  const [inputMins, setInputMins] = useState(String(totalMins));

  // Initialize Pomo if empty
  useEffect(() => {
    if (pomoSecondsLeft === null) {
      resetPomo(settings.pomodoroMinutes);
    }
  }, [pomoSecondsLeft, resetPomo, settings.pomodoroMinutes]);

  const handleToggleMain = () => {
    const now = new Date();
    
    if (isMainRunning) {
      // PAUSING: log the study segment
      if (segmentStartTime) {
        const start = new Date(segmentStartTime);
        const diffMins = Math.round((now.getTime() - start.getTime()) / 60000);
        if (diffMins > 0) {
          addStudySession(date, {
            startTime: segmentStartTime,
            endTime: now.toISOString(),
            durationMinutes: diffMins,
            type: 'timer',
            title: 'Stopwatch Session'
          });
        }
      }
      setLastPauseTime(now.toISOString());
      setSegmentStartTime(null);
    } else {
      // STARTING / RESUMING: log the break
      if (lastPauseTime) {
        const pauseStart = new Date(lastPauseTime);
        const breakMins = Math.round((now.getTime() - pauseStart.getTime()) / 60000);
        if (breakMins > 0) {
          addStudySession(date, {
            startTime: lastPauseTime,
            endTime: now.toISOString(),
            durationMinutes: breakMins,
            type: 'break',
            title: 'Break'
          });
        }
      }
      setSegmentStartTime(now.toISOString());
      setLastPauseTime(null);
    }
    
    toggleMain();
  };

  const handleMainSave = () => {
    const now = new Date();

    if (isMainRunning && segmentStartTime) {
      // Log the final running segment
      const start = new Date(segmentStartTime);
      const diffMins = Math.round((now.getTime() - start.getTime()) / 60000);
      if (diffMins > 0) {
        addStudySession(date, {
          startTime: segmentStartTime,
          endTime: now.toISOString(),
          durationMinutes: diffMins,
          type: 'timer',
          title: 'Stopwatch Session'
        });
      }
    }
    
    // Alert the user of total saved
    const minsToSave = Math.max(1, Math.round(mainSeconds / 60));
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Saved ${minsToSave} minutes total for this session!`, type: 'success' } }));

    resetMain();
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

  const handleDeleteSession = (sessionId: string, type: 'manual' | 'timer' | 'task' | 'break', taskId?: string) => {
    removeStudySession(date, sessionId);
    if (type === 'task' && taskId) {
      updateTask(taskId, { completed: false, completedAt: null, actualMinutes: null });
    }
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Session deleted', type: 'info' } }));
  };

  const formatSecs = (s: number | null) => {
    if (s === null) return '00:00';
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/12 via-[hsl(var(--card))] to-indigo-500/10 p-5 shadow-sm sm:p-6">
      <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_auto] lg:items-center">
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
                <Timer className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight sm:text-base">{title}</h3>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{subtitle}</p>
              </div>
            </div>

            {editing ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={inputHours}
                  onChange={(e) => setInputHours(e.target.value)}
                  className="w-14 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-center text-sm focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={inputMins}
                  onChange={(e) => setInputMins(e.target.value)}
                  className="w-14 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-center text-sm focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">m</span>
                <div className="flex gap-1">
                  <button onClick={handleManualSave} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700">Save</button>
                  <button onClick={() => setEditing(false)} className="rounded-lg bg-[hsl(var(--muted))] px-3 py-1.5 text-xs font-medium transition hover:bg-[hsl(var(--accent))]">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setInputHours(String(totalHours)); setInputMins(String(totalMins)); setEditing(true); }}
                className="group text-left"
              >
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black tracking-tight text-emerald-500 sm:text-5xl lg:text-6xl">{totalHours}</span>
                  <span className="pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">h</span>
                  <span className="text-3xl font-black tracking-tight text-emerald-500 sm:text-5xl lg:text-6xl">{totalMins.toString().padStart(2, '0')}</span>
                  <span className="pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">m</span>
                </div>
                <span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))] opacity-0 transition group-hover:opacity-100">click to edit</span>
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/70 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Goal</p>
              <p className="mt-1 text-xl font-bold text-[hsl(var(--foreground))]">{settings.dailyStudyGoalHours || 8}h</p>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/70 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Reached</p>
              <p className="mt-1 text-xl font-bold text-emerald-500">{progressPct}%</p>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]/70 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Reset</p>
              <p className="mt-1 text-sm font-semibold text-[hsl(var(--foreground))]">{isToday ? '12:00 AM' : 'Today only'}</p>
            </div>
          </div>

          {goalMinutes > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="uppercase tracking-wider text-[10px] text-[hsl(var(--muted-foreground))]">Daily Goal Progress</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", progressPct >= 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500")}>{progressPct}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", progressPct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-emerald-500")}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center rounded-3xl border border-[hsl(var(--border))] bg-white/50 p-4 shadow-inner backdrop-blur dark:bg-[hsl(var(--card))]/50">
          <ProgressRing
            value={progressPct}
            size={130}
            strokeWidth={10}
            color={progressPct >= 100 ? '#22c55e' : '#10b981'}
            bgColor="hsl(var(--muted))"
            label={`${progressPct}%`}
            sublabel="of daily goal"
          />
        </div>
      </div>

      {/* Dual Timers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Main User Timer */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col items-center">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Main Stopwatch</span>
          <div className="text-4xl font-bold font-mono tracking-tight mb-4 tabular-nums">
            {formatSecs(mainSeconds)}
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-center">
            <button
              onClick={handleToggleMain}
              className={cn("px-6 py-2 rounded-xl text-sm font-medium transition text-white shadow-sm flex-1 max-w-[120px]", isMainRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700")}
            >
              {isMainRunning ? 'Pause' : 'Start'}
            </button>
            {mainSeconds > 0 && (
              <button
                onClick={handleMainSave}
                className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm flex-1 max-w-[120px]"
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
          <div className="text-4xl font-bold font-mono tracking-tight mb-4 tabular-nums">
            {formatSecs(pomoSecondsLeft)}
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-center">
            <button
              onClick={() => togglePomo(settings.pomodoroMinutes)}
              className={cn("px-6 py-2 rounded-xl text-sm font-medium transition text-white shadow-sm flex-1 max-w-[120px]", pomoMode === 'study' ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700")}
            >
              {isPomoRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => resetPomo(pomoMode === 'study' ? settings.pomodoroMinutes : settings.breakMinutes)}
              className="px-6 py-2 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium hover:opacity-80 transition flex-1 max-w-[120px]"
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
            {[...sessions].reverse().map((session) => {
              const isBreak = session.type === 'break';
              return (
                <div key={session.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))] text-sm">
                  <div>
                    <p className={cn("font-medium", isBreak ? "text-amber-600 dark:text-amber-500" : "")}>{session.title || 'Stopwatch Session'}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className={cn("w-3.5 h-3.5", isBreak ? "text-amber-500" : "text-emerald-500")} />
                      <span className={cn("font-medium", isBreak ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                        {session.durationMinutes} min
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteSession(session.id, session.type, session.taskId)}
                      className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
