import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityEntry, DailyLog, StudySession } from '@/types';
import { generateId, getToday } from '@/lib/utils';

interface ActivityState {
  activities: ActivityEntry[];
  dailyLogs: DailyLog[];
  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  addDailyLog: (log: DailyLog) => void;
  updateDailyLog: (date: string, updates: Partial<DailyLog>) => void;
  getDailyLog: (date: string) => DailyLog | undefined;
  addStudySession: (date: string, session: Omit<StudySession, 'id'>) => void;
  removeStudySession: (date: string, sessionId: string) => void;
  setActivities: (activities: ActivityEntry[]) => void;
  setDailyLogs: (logs: DailyLog[]) => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],
      dailyLogs: [],

      addActivity: (activity) =>
        set((state) => ({
          activities: [
            {
              ...activity,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
            ...state.activities,
          ].slice(0, 100), // Keep last 100 activities
        })),

      addDailyLog: (log) =>
        set((state) => ({
          dailyLogs: [...state.dailyLogs.filter(l => l.date !== log.date), log],
        })),

      updateDailyLog: (date, updates) =>
        set((state) => {
          const existing = state.dailyLogs.find(l => l.date === date);
          if (existing) {
            return {
              dailyLogs: state.dailyLogs.map(l =>
                l.date === date ? { ...l, ...updates } : l
              ),
            };
          }
          return {
            dailyLogs: [
              ...state.dailyLogs,
              {
                date,
                studyMinutes: 0,
                topicsCompleted: 0,
                tasksCompleted: 0,
                revisionsCompleted: 0,
                ...updates,
              },
            ],
          };
        }),

      addStudySession: (date, session) =>
        set((state) => {
          const newSession: StudySession = { ...session, id: generateId() };
          const existing = state.dailyLogs.find((l) => l.date === date);

          if (existing) {
            return {
              dailyLogs: state.dailyLogs.map((l) =>
                l.date === date
                  ? {
                      ...l,
                      studyMinutes: l.studyMinutes + newSession.durationMinutes,
                      sessions: [...(l.sessions || []), newSession],
                    }
                  : l
              ),
            };
          }
          return {
            dailyLogs: [
              ...state.dailyLogs,
              {
                date,
                studyMinutes: newSession.durationMinutes,
                topicsCompleted: 0,
                tasksCompleted: 0,
                revisionsCompleted: 0,
                sessions: [newSession],
              },
            ],
          };
        }),

      removeStudySession: (date, sessionId) =>
        set((state) => {
          const existing = state.dailyLogs.find((l) => l.date === date);
          if (!existing || !existing.sessions) return state;

          const sessionToRemove = existing.sessions.find(s => s.id === sessionId);
          if (!sessionToRemove) return state;

          return {
            dailyLogs: state.dailyLogs.map((l) => {
              if (l.date === date) {
                const currentTotal = Number(l.studyMinutes) || 0;
                const deduct = Number(sessionToRemove.durationMinutes) || 0;
                return {
                  ...l,
                  studyMinutes: Math.max(0, currentTotal - deduct),
                  sessions: l.sessions!.filter(s => s.id !== sessionId),
                };
              }
              return l;
            }),
          };
        }),

      getDailyLog: (date) => {
        return get().dailyLogs.find(l => l.date === date);
      },

      setActivities: (activities) => set({ activities }),
      setDailyLogs: (logs) => set({ dailyLogs: logs }),
    }),
    {
      name: 'study-tracker-activity-v3',
    }
  )
);
