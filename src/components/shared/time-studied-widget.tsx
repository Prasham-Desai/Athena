'use client';

import { useState, useEffect } from 'react';
import { Timer, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useActivityStore } from '@/store/activity-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTimerStore } from '@/store/timer-store';
import { useTasksStore } from '@/store/tasks-store';

export function TimeStudiedWidget({ date }: { date: string }) {
  const { dailyLogs, updateDailyLog, addStudySession, removeStudySession } = useActivityStore();
  const { settings } = useSettingsStore();
  const updateTask = useTasksStore(s => s.updateTask);
  
  const { 
    isMainRunning, mainSeconds, mainStartTime, toggleMain, resetMain,
    isPomoRunning, pomoSecondsLeft, pomoMode, togglePomo, resetPomo
  } = useTimerStore();

  const log = dailyLogs.find((l) => l.date === date);
  const totalMinutes = log?.studyMinutes ?? 0;
  const sessions = log?.sessions ?? [];
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const goalMinutes = (settings.dailyStudyGoalHours || 8) * 60;
  const progressPct = Math.min(100, Math.round((totalMinutes / goalMinutes) * 100));

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

  const handleMainSave = () => {
    // Minimum 1 min threshold
    const minsToSave = Math.max(1, Math.floor(mainSeconds / 60));
    
    if (mainSeconds > 0) {
      addStudySession(date, {
        startTime: mainStartTime || new Date(Date.now() - minsToSave * 60000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: minsToSave,
        type: 'timer',
        title: 'Stopwatch Session'
      });
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Added ${minsToSave} minutes to today's total!`, type: 'success' } }));
    }
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

  const handleDeleteSession = (sessionId: string, type: 'manual' | 'timer' | 'task', taskId?: string) => {
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
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm space-y-5">
      {/* Total Time Studied Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Timer className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Total Time Studied Today</h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
              {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d')}
              {settings.dailyStudyGoalHours ? ` • Goal: ${settings.dailyStudyGoalHours}h` : ''}
            </p>
          </div>
        </div>

        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number" min={0} value={inputHours} onChange={(e) => setInputHours(e.target.value)}
              className="w-14 px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-center focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">h</span>
            <input
              type="number" min={0} max={59} value={inputMins} onChange={(e) => setInputMins(e.target.value)}
              className="w-14 px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-center focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">m</span>
            <div className="flex gap-1">
              <button onClick={handleManualSave} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-xs font-medium transition">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setInputHours(String(totalHours)); setInputMins(String(totalMins)); setEditing(true); }} className="text-left sm:text-right group">
            <div className="flex items-baseline gap-0.5 sm:justify-end">
              <span className="text-3xl font-bold text-emerald-500">{totalHours}</span>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">h</span>
              <span className="text-3xl font-bold text-emerald-500 ml-1">{totalMins.toString().padStart(2, '0')}</span>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">m</span>
            </div>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition block">click to edit</span>
          </button>
        )}
      </div>

      {/* Prominent Daily Goal Progress Bar */}
      {goalMinutes > 0 && (
        <div className="pb-5 border-b border-[hsl(var(--border))] space-y-2.5">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]">Daily Goal Progress</span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", progressPct >= 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500")}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", progressPct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500")}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Dual Timers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Main User Timer */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex flex-col items-center">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Main Stopwatch</span>
          <div className="text-4xl font-bold font-mono tracking-tight mb-4 tabular-nums">
            {formatSecs(mainSeconds)}
          </div>
          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={toggleMain}
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
          <div className="flex gap-2 w-full justify-center">
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
            {[...sessions].reverse().map((session) => (
              <div key={session.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))] text-sm">
                <div>
                  <p className="font-medium">{session.title || 'Study Session'}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{session.durationMinutes} min</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteSession(session.id, session.type, session.taskId)}
                    className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
