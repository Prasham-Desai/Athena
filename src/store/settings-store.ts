import { create } from 'zustand';
import type { UserSettings } from '@/types';

interface SettingsState {
  settings: UserSettings;
  fetchSettings: () => Promise<UserSettings | null>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<UserSettings | null>;
  resetSettings: () => Promise<UserSettings | null>;
  setSettings: (settings: UserSettings) => void;
}

export const defaultSettings: UserSettings = {
  theme: 'dark',
  dailyStudyGoalHours: 6,
  showWelcome: true,
  pomodoroMinutes: 25,
  breakMinutes: 5,
  fontSize: 'small',
};

async function saveSettings(updates: Partial<UserSettings>) {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to save settings');
  }

  const payload = await response.json();
  return payload.data as UserSettings;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: defaultSettings,

  fetchSettings: async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) return null;

      const payload = await response.json();
      if (payload?.data) {
        set({ settings: payload.data });
        return payload.data as UserSettings;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch settings', error);
      return null;
    }
  },

  updateSettings: async (updates) => {
    const nextSettings = { ...get().settings, ...updates };
    set({ settings: nextSettings });

    try {
      const saved = await saveSettings(updates);
      if (saved) {
        set({ settings: saved });
        return saved;
      }
    } catch (error) {
      console.error('Failed to save settings', error);
    }

    return nextSettings;
  },

  resetSettings: async () => {
    set({ settings: defaultSettings });

    try {
      const saved = await saveSettings(defaultSettings);
      if (saved) {
        set({ settings: saved });
        return saved;
      }
    } catch (error) {
      console.error('Failed to reset settings', error);
    }

    return defaultSettings;
  },

  setSettings: (settings) => set({ settings }),
}));
