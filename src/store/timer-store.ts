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
          const nowDate = new Date(now);
          const lastTickDate = new Date(state.lastTick);
          
          const isNewDay = 
            nowDate.getFullYear() !== lastTickDate.getFullYear() ||
            nowDate.getMonth() !== lastTickDate.getMonth() ||
            nowDate.getDate() !== lastTickDate.getDate();

          if (isNewDay) {
            const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
            
            if (state.isMainRunning) {
              return {
                mainSeconds: Math.floor((now - midnight) / 1000),
                lastTick: now - ((now - midnight) % 1000),
                mainStartTime: new Date(midnight).toISOString(),
                segmentStartTime: new Date(midnight).toISOString(),
                lastPauseTime: null,
              };
            } else {
              return {
                isMainRunning: false,
                mainSeconds: 0,
                lastTick: now,
                mainStartTime: null,
                segmentStartTime: null,
                lastPauseTime: null,
              };
            }
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
