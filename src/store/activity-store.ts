import { create } from 'zustand';
import type { ActivityEntry, DailyLog, StudySession } from '@/types';
import { generateId, getToday } from '@/lib/utils';

interface ActivityState {
  activities: ActivityEntry[];
  dailyLogs: DailyLog[];
  fetchActivities: () => Promise<void>;
  fetchDailyLogs: () => Promise<void>;
  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => Promise<void>;
  addDailyLog: (log: DailyLog) => Promise<void>;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => Promise<void>;
  getDailyLog: (date: string) => DailyLog | undefined;
  addStudySession: (date: string, session: Omit<StudySession, 'id'>) => Promise<void>;
  removeStudySession: (date: string, sessionId: string) => Promise<void>;
  setActivities: (activities: ActivityEntry[]) => void;
  setDailyLogs: (logs: DailyLog[]) => void;
}

async function refreshDailyLogs(setDailyLogs: (logs: DailyLog[]) => void) {
  const response = await fetch('/api/daily-logs');
  if (!response.ok) return;

  const payload = (await response.json()) as { data?: DailyLog[] };
  if (payload?.data) {
    setDailyLogs(payload.data as DailyLog[]);
  }
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  activities: [],
  dailyLogs: [],

  fetchActivities: async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) return;

      const payload = (await response.json()) as { data?: ActivityEntry[] };
      if (payload?.data) {
        set({ activities: payload.data as ActivityEntry[] });
      }
    } catch (error) {
      console.error('Failed to fetch activities', error);
    }
  },

  fetchDailyLogs: async () => {
    try {
      await refreshDailyLogs((logs) => set({ dailyLogs: logs }));
    } catch (error) {
      console.error('Failed to fetch daily logs', error);
    }
  },

  addActivity: async (activity) => {
    const previousActivities = get().activities;
    const isDynamicType = ['topic-completed', 'topic-revised', 'task-completed', 'study-block-completed'].includes(activity.type);

    if (isDynamicType) {
      // It's a dynamically generated activity. We just refresh the timeline.
      await get().fetchActivities();
      // And also refresh daily logs just in case they are tied together in the UI
      await get().fetchDailyLogs();
      return;
    }

    const optimisticActivity: ActivityEntry = {
      ...activity,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      activities: [optimisticActivity, ...state.activities].slice(0, 100),
    }));

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticActivity),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ activities: previousActivities });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to save activity', error);
      throw error;
    }
  },

  addDailyLog: async (log) => {
    const previousDailyLogs = get().dailyLogs;
    set((state) => ({
      dailyLogs: [...state.dailyLogs.filter((entry) => entry.date !== log.date), log],
    }));

    try {
      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: log.date, updates: log }),
      });
      if (!response.ok) throw new Error('Failed');
      await refreshDailyLogs((logs) => set({ dailyLogs: logs }));
    } catch (error) {
      set({ dailyLogs: previousDailyLogs });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to save daily log', error);
      throw error;
    }
  },

  updateDailyLog: async (date, updates) => {
    const previousDailyLogs = get().dailyLogs;
    const current = get().dailyLogs.find((entry) => entry.date === date);
    const merged = current
      ? { ...current, ...updates }
      : {
          date,
          studyMinutes: 0,
          topicsCompleted: 0,
          tasksCompleted: 0,
          revisionsCompleted: 0,
          ...updates,
        };

    set((state) => {
      const existing = state.dailyLogs.find((entry) => entry.date === date);
      if (existing) {
        return {
          dailyLogs: state.dailyLogs.map((entry) => (entry.date === date ? merged : entry)),
        };
      }

      return {
        dailyLogs: [...state.dailyLogs, merged],
      };
    });

    try {
      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, updates }),
      });
      if (!response.ok) throw new Error('Failed');
      await refreshDailyLogs((logs) => set({ dailyLogs: logs }));
    } catch (error) {
      set({ dailyLogs: previousDailyLogs });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to update daily log', error);
      throw error;
    }
  },

  addStudySession: async (date, session) => {
    const previousDailyLogs = get().dailyLogs;
    const newSession: StudySession = { ...session, id: generateId() };
    const existing = get().dailyLogs.find((entry) => entry.date === date);

    set((state) => {
      const nextLogs = state.dailyLogs.filter((entry) => entry.date !== date);
      const nextLog = existing
        ? {
            ...existing,
            studyMinutes: (Number(existing.studyMinutes) || 0) + newSession.durationMinutes,
            sessions: [...(existing.sessions || []), newSession],
          }
        : {
            date,
            studyMinutes: newSession.durationMinutes,
            topicsCompleted: 0,
            tasksCompleted: 0,
            revisionsCompleted: 0,
            sessions: [newSession],
          };

      return {
        dailyLogs: [...nextLogs, nextLog].sort((a, b) => a.date.localeCompare(b.date)),
      };
    });

    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, session: newSession }),
      });
      if (!response.ok) throw new Error('Failed');
      await refreshDailyLogs((logs) => set({ dailyLogs: logs }));
    } catch (error) {
      set({ dailyLogs: previousDailyLogs });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to save study session', error);
      throw error;
    }
  },

  removeStudySession: async (date, sessionId) => {
    const previousDailyLogs = get().dailyLogs;
    const existing = get().dailyLogs.find((entry) => entry.date === date);
    const sessionToRemove = existing?.sessions?.find((session) => session.id === sessionId);

    if (!existing || !sessionToRemove) return;

    set((state) => ({
      dailyLogs: state.dailyLogs.map((entry) => {
        if (entry.date !== date) return entry;

        const currentTotal = Number(entry.studyMinutes) || 0;
        const deduct = Number(sessionToRemove.durationMinutes) || 0;

        return {
          ...entry,
          studyMinutes: Math.max(0, currentTotal - deduct),
          sessions: (entry.sessions || []).filter((session) => session.id !== sessionId),
        };
      }),
    }));

    try {
      const response = await fetch(`/api/study-sessions?id=${encodeURIComponent(sessionId)}&date=${encodeURIComponent(date)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete study session');
      }

      await refreshDailyLogs((logs) => set({ dailyLogs: logs }));
    } catch (error) {
      set({ dailyLogs: previousDailyLogs });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to delete study session', error);
      throw error;
    }
  },

  getDailyLog: (date) => get().dailyLogs.find((entry) => entry.date === date),

  setActivities: (activities) => set({ activities }),
  setDailyLogs: (logs) => set({ dailyLogs: logs }),
}));
