import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  // Main Stopwatch
  isMainRunning: boolean;
  mainSeconds: number;
  mainStartTime: string | null;
  lastTick: number; // timestamp to calculate elapsed time when away
  
  // Pomodoro Timer
  isPomoRunning: boolean;
  pomoSecondsLeft: number | null; // null means not initialized
  pomoMode: 'study' | 'break';

  // Actions
  toggleMain: () => void;
  resetMain: () => void;
  setMainSeconds: (s: number) => void;
  
  togglePomo: (defaultMinutes: number) => void;
  resetPomo: (defaultMinutes: number) => void;
  setPomoMode: (mode: 'study' | 'break', defaultMinutes: number) => void;
  
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

      isPomoRunning: false,
      pomoSecondsLeft: null,
      pomoMode: 'study',

      toggleMain: () => set((state) => {
        const nextState = !state.isMainRunning;
        return {
          isMainRunning: nextState,
          mainStartTime: nextState && !state.mainStartTime ? new Date().toISOString() : state.mainStartTime,
          // Start pomo automatically if we're starting main and pomo is stopped
          isPomoRunning: nextState && !state.isPomoRunning ? true : state.isPomoRunning,
          lastTick: Date.now(),
        };
      }),

      resetMain: () => set({ isMainRunning: false, mainSeconds: 0, mainStartTime: null, lastTick: Date.now() }),
      
      setMainSeconds: (s) => set({ mainSeconds: s }),

      togglePomo: (defaultMinutes) => set((state) => ({
        isPomoRunning: !state.isPomoRunning,
        pomoSecondsLeft: state.pomoSecondsLeft === null ? defaultMinutes * 60 : state.pomoSecondsLeft,
        lastTick: Date.now(),
      })),

      resetPomo: (defaultMinutes) => set((state) => ({
        isPomoRunning: false,
        pomoSecondsLeft: defaultMinutes * 60,
      })),

      setPomoMode: (mode, defaultMinutes) => set({
        pomoMode: mode,
        pomoSecondsLeft: defaultMinutes * 60,
        isPomoRunning: false, // auto pause on switch
      }),

      tick: () => {
        const now = Date.now();
        set((state) => {
          if (!state.isMainRunning && !state.isPomoRunning) {
            return { lastTick: now };
          }

          const deltaSeconds = Math.floor((now - state.lastTick) / 1000);
          if (deltaSeconds <= 0) return {}; // Wait for at least 1 second

          let newMainSeconds = state.mainSeconds;
          let newPomoSecondsLeft = state.pomoSecondsLeft;
          let newPomoRunning = state.isPomoRunning;
          let newPomoMode = state.pomoMode;

          if (state.isMainRunning) {
            newMainSeconds += deltaSeconds;
          }

          let reachedZero = false;

          if (state.isPomoRunning && newPomoSecondsLeft !== null) {
            newPomoSecondsLeft -= deltaSeconds;
            if (newPomoSecondsLeft <= 0) {
              // Time's up for pomodoro
              reachedZero = true;
              newPomoRunning = false;
              newPomoSecondsLeft = 0; // will be reset by UI or provider
            }
          }

          // Return updated state
          return {
            mainSeconds: newMainSeconds,
            pomoSecondsLeft: newPomoSecondsLeft,
            isPomoRunning: newPomoRunning,
            pomoMode: newPomoMode,
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
        isPomoRunning: state.isPomoRunning,
        pomoSecondsLeft: state.pomoSecondsLeft,
        pomoMode: state.pomoMode,
      }),
    }
  )
);
