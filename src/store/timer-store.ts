import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  // Main Stopwatch
  isMainRunning: boolean;
  mainSeconds: number;
  mainStartTime: string | null;
  lastTick: number; // timestamp to calculate elapsed time when away
  
  // New fields for segment tracking
  segmentStartTime: string | null;
  lastPauseTime: string | null;
  // Actions
  toggleMain: () => void;
  resetMain: () => void;
  setMainSeconds: (s: number) => void;
  
  setSegmentStartTime: (time: string | null) => void;
  setLastPauseTime: (time: string | null) => void;
  
  // Tick action to be called regularly (e.g. from a global provider)
  tick: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isMainRunning: false,
      mainSeconds: 0,
      mainStartTime: null,
      lastTick: Date.now(),
      segmentStartTime: null,
      lastPauseTime: null,

      toggleMain: () => set((state) => {
        const nextState = !state.isMainRunning;
        return {
          isMainRunning: nextState,
          mainStartTime: nextState && !state.mainStartTime ? new Date().toISOString() : state.mainStartTime,
          lastTick: Date.now(),
        };
      }),

      resetMain: () => set({ 
        isMainRunning: false, 
        mainSeconds: 0, 
        mainStartTime: null, 
        lastTick: Date.now(),
        segmentStartTime: null,
        lastPauseTime: null,
      }),
      
      setMainSeconds: (s) => set({ mainSeconds: s }),
      setSegmentStartTime: (time) => set({ segmentStartTime: time }),
      setLastPauseTime: (time) => set({ lastPauseTime: time }),

      tick: () => {
        const now = Date.now();
        set((state) => {
          // IST is UTC + 5:30 (5.5 hours)
          const IST_OFFSET = 5.5 * 60 * 60 * 1000;
          const nowIST = new Date(now + IST_OFFSET);
          const lastTickIST = new Date(state.lastTick + IST_OFFSET);
          
          const isNewDay = 
            nowIST.getUTCFullYear() !== lastTickIST.getUTCFullYear() ||
            nowIST.getUTCMonth() !== lastTickIST.getUTCMonth() ||
            nowIST.getUTCDate() !== lastTickIST.getUTCDate();

          if (isNewDay) {
            return {
              isMainRunning: false,
              mainSeconds: 0,
              lastTick: now,
              mainStartTime: null,
              segmentStartTime: null,
              lastPauseTime: null,
            };
          }

          if (!state.isMainRunning) {
            return { lastTick: now };
          }

          const deltaSeconds = Math.floor((now - state.lastTick) / 1000);
          if (deltaSeconds <= 0) return {}; // Wait for at least 1 second

          let newMainSeconds = state.mainSeconds;

          if (state.isMainRunning) {
            newMainSeconds += deltaSeconds;
          }

          // Return updated state
          return {
            mainSeconds: newMainSeconds,
            lastTick: now - ((now - state.lastTick) % 1000), // Keep fractional remainder
          };
        });
      }
    }),
    {
      name: 'study-tracker-timer',
      partialize: (state) => ({
        isMainRunning: state.isMainRunning,
        mainSeconds: state.mainSeconds,
        mainStartTime: state.mainStartTime,
        lastTick: state.lastTick,
        segmentStartTime: state.segmentStartTime,
        lastPauseTime: state.lastPauseTime,
      }),
    }
  )
);
