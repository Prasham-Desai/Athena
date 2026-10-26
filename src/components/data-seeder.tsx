'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSubjectsStore } from '@/store/subjects-store';
import { useTasksStore } from '@/store/tasks-store';
import { usePlannerStore } from '@/store/planner-store';
import { useActivityStore } from '@/store/activity-store';
import { useSettingsStore } from '@/store/settings-store';

import { useAcademicYearStore } from '@/store/academic-year-store';

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
      try {
        // 1. Resolve academic years first (defaults to Third Year)
        await useAcademicYearStore.getState().fetchAcademicYears();
        const activeYearId = useAcademicYearStore.getState().activeYearId;

        // 2. Fetch shared year-specific data and settings in parallel.
        const [settings] = await Promise.all([
          useSettingsStore.getState().fetchSettings(),
          useSubjectsStore.getState().fetchSubjects(activeYearId),
          useTasksStore.getState().fetchTasks(activeYearId),
          usePlannerStore.getState().fetchStudyBlocks(activeYearId),
          useActivityStore.getState().fetchActivities(activeYearId),
          useActivityStore.getState().fetchDailyLogs(activeYearId),
        ]);

        if (settings?.theme) {
          setTheme(settings.theme);
        }
      } catch (error) {
        console.error('Failed to initialize app data', error);
      }
    })();

  }, [setTheme]);

  return null;
}
