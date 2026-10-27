import { create } from 'zustand';
import type { ActivityEntry, DailyLog, StudySession } from '@/types';
import { generateId, getToday } from '@/lib/utils';

interface ActivityState {
  activities: ActivityEntry[];
  dailyLogs: DailyLog[];
  activitiesByYear: Record<string, ActivityEntry[]>;
  dailyLogsByYear: Record<string, DailyLog[]>;
  isLoadingActivities: boolean;
  isLoadingDailyLogs: boolean;
  fetchActivities: (academicYearId?: string, force?: boolean) => Promise<void>;
  fetchDailyLogs: (academicYearId?: string, force?: boolean) => Promise<void>;
  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => Promise<void>;
  addDailyLog: (log: DailyLog) => Promise<void>;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => Promise<void>;
  getDailyLog: (date: string) => DailyLog | undefined;
  addStudySession: (date: string, session: Omit<StudySession, 'id'>) => Promise<void>;
  removeStudySession: (date: string, sessionId: string) => Promise<void>;
  setActivities: (activities: ActivityEntry[]) => void;
  setDailyLogs: (logs: DailyLog[]) => void;
}

async function refreshDailyLogs(setDailyLogs: (logs: DailyLog[]) => void, academicYearId?: string) {
  const yearId = academicYearId || (typeof window !== 'undefined' ? (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId : 'year_3');
  const url = yearId ? `/api/daily-logs?academic_year_id=${yearId}` : '/api/daily-logs';
  const response = await fetch(url);
  if (!response.ok) return;

  const payload = (await response.json()) as { data?: DailyLog[] };
  if (payload?.data) {
    setDailyLogs(payload.data as DailyLog[]);
  }
}

let activitiesFetchId = 0;
let dailyLogsFetchId = 0;
const inFlightActivitiesMap = new Map<string, Promise<any>>();
const inFlightDailyLogsMap = new Map<string, Promise<any>>();

export const useActivityStore = create<ActivityState>()((set, get) => ({
  activities: [],
  dailyLogs: [],
  activitiesByYear: {},
  dailyLogsByYear: {},
  isLoadingActivities: false,
  isLoadingDailyLogs: false,

  fetchActivities: async (academicYearId?: string, force?: boolean) => {
    const activeYearStore = (await import('./academic-year-store')).useAcademicYearStore;
    const yearId = academicYearId || (typeof window !== 'undefined' ? activeYearStore.getState().activeYearId : 'year_3');

    const cached = get().activitiesByYear[yearId];
    const isCurrentActive = typeof window !== 'undefined'
      ? activeYearStore.getState().activeYearId === yearId
      : true;

    if (cached && !force) {
      if (isCurrentActive) {
        set({ activities: cached, isLoadingActivities: false });
      }
      return;
    }

    if (inFlightActivitiesMap.has(yearId)) {
      return inFlightActivitiesMap.get(yearId);
    }

    const requestId = ++activitiesFetchId;
    if (isCurrentActive && !cached) {
      set({ isLoadingActivities: true });
    }

    const promise = (async () => {
      try {
        const url = yearId ? `/api/activities?academic_year_id=${yearId}` : '/api/activities';
        const response = await fetch(url);
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: ActivityEntry[] };
        if (payload?.data) {
          const loaded = payload.data as ActivityEntry[];
          set((state) => {
            const currentYear = activeYearStore.getState().activeYearId;
            return {
              activitiesByYear: { ...state.activitiesByYear, [yearId]: loaded },
              activities: (currentYear === yearId || !currentYear) ? loaded : state.activities,
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch activities', error);
      } finally {
        if (requestId === activitiesFetchId) set({ isLoadingActivities: false });
        inFlightActivitiesMap.delete(yearId);
      }
    })();

    inFlightActivitiesMap.set(yearId, promise);
    return promise;
  },

  fetchDailyLogs: async (academicYearId?: string, force?: boolean) => {
    const activeYearStore = (await import('./academic-year-store')).useAcademicYearStore;
    const yearId = academicYearId || (typeof window !== 'undefined' ? activeYearStore.getState().activeYearId : 'year_3');

    const cached = get().dailyLogsByYear[yearId];
    const isCurrentActive = typeof window !== 'undefined'
      ? activeYearStore.getState().activeYearId === yearId
      : true;

    if (cached && !force) {
      if (isCurrentActive) {
        set({ dailyLogs: cached, isLoadingDailyLogs: false });
      }
      return;
    }

    if (inFlightDailyLogsMap.has(yearId)) {
      return inFlightDailyLogsMap.get(yearId);
    }

    const requestId = ++dailyLogsFetchId;
    if (isCurrentActive && !cached) {
      set({ isLoadingDailyLogs: true });
    }

    const promise = (async () => {
      try {
        await refreshDailyLogs((logs) => {
          set((state) => {
            const currentYear = activeYearStore.getState().activeYearId;
            return {
              dailyLogsByYear: { ...state.dailyLogsByYear, [yearId]: logs },
              dailyLogs: (currentYear === yearId || !currentYear) ? logs : state.dailyLogs,
            };
          });
        }, academicYearId);
      } catch (error) {
        console.error('Failed to fetch daily logs', error);
      } finally {
        if (requestId === dailyLogsFetchId) set({ isLoadingDailyLogs: false });
        inFlightDailyLogsMap.delete(yearId);
      }
    })();

    inFlightDailyLogsMap.set(yearId, promise);
    return promise;
  },

  addActivity: async (activity) => {
    const previousActivities = get().activities;
    const isDynamicType = ['topic-completed', 'task-completed', 'study-block-completed'].includes(activity.type);

    if (isDynamicType) {
      // It's a dynamically generated activity. We just refresh the timeline.
      await get().fetchActivities();
      // And also refresh daily logs just in case they are tied together in the UI
      await get().fetchDailyLogs();
      return;
    }

    const yearId = (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId || 'year_3';
    const optimisticActivity: ActivityEntry = {
      ...activity,
      id: generateId(),
      academicYearId: yearId,
      academic_year_id: yearId,
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
    const yearId = (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId || 'year_3';
    const logWithYear = { ...log, academicYearId: yearId, academic_year_id: yearId };

    set((state) => ({
      dailyLogs: [...state.dailyLogs.filter((entry) => entry.date !== log.date), logWithYear],
    }));

    try {
      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: log.date, updates: logWithYear, academicYearId: yearId }),
      });
      if (!response.ok) throw new Error('Failed');
      await refreshDailyLogs((logs) => set({ dailyLogs: logs }), yearId);
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
    
    // Recalculate duration from actual start/end times (same logic as server)
    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(session.endTime).getTime();
    const correctDuration = (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs)
      ? Math.max(1, Math.round((endMs - startMs) / 60000))
      : (session.durationMinutes || 0);
    
    const newSession: StudySession = { ...session, id: generateId(), durationMinutes: correctDuration };
    const existing = get().dailyLogs.find((entry) => entry.date === date);

    set((state) => {
      const nextLogs = state.dailyLogs.filter((entry) => entry.date !== date);
      const isBreak = newSession.type === 'break';
      const addedMinutes = isBreak ? 0 : newSession.durationMinutes;
      
      const nextLog = existing
        ? {
            ...existing,
            studyMinutes: (Number(existing.studyMinutes) || 0) + addedMinutes,
            sessions: [...(existing.sessions || []), newSession],
          }
        : {
            date,
            studyMinutes: addedMinutes,
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
      const yearId = (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId || 'year_3';
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, session: { ...newSession, academicYearId: yearId }, academicYearId: yearId }),
      });
      if (!response.ok) throw new Error('Failed');
      await refreshDailyLogs((logs) => set({ dailyLogs: logs }), yearId);
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
        const isBreak = sessionToRemove.type === 'break';
        const deduct = isBreak ? 0 : (Number(sessionToRemove.durationMinutes) || 0);

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

  setActivities: (activities) => {
    const yearId = activities[0]?.academic_year_id || activities[0]?.academicYearId;
    set((state) => ({
      activities,
      activitiesByYear: yearId ? { ...state.activitiesByYear, [yearId]: activities } : state.activitiesByYear,
    }));
  },
  setDailyLogs: (logs) => {
    const yearId = logs[0]?.academic_year_id || logs[0]?.academicYearId;
    set((state) => ({
      dailyLogs: logs,
      dailyLogsByYear: yearId ? { ...state.dailyLogsByYear, [yearId]: logs } : state.dailyLogsByYear,
    }));
  },
}));
