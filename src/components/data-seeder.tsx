'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSubjectsStore } from '@/store/subjects-store';
import { useTasksStore } from '@/store/tasks-store';
import { usePlannerStore } from '@/store/planner-store';
import { useActivityStore } from '@/store/activity-store';
import { useSettingsStore } from '@/store/settings-store';

/**
 * Component that hydrates the application data from the Cloudflare API.
 */
export function DataSeeder() {
  const initialized = useRef(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Fetch initial data from the Cloudflare Edge API
    void (async () => {
      const [settings] = await Promise.all([
        useSettingsStore.getState().fetchSettings(),
        useSubjectsStore.getState().fetchSubjects(),
        useTasksStore.getState().fetchTasks(),
        usePlannerStore.getState().fetchStudyBlocks(),
        useActivityStore.getState().fetchActivities(),
        useActivityStore.getState().fetchDailyLogs(),
      ]);

      if (settings?.theme) {
        setTheme(settings.theme);
      }
    })();

  }, [setTheme]);

  return null;
}
