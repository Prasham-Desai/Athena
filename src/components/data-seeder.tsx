'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useSubjectsStore } from '@/store/subjects-store';
import { useTasksStore } from '@/store/tasks-store';
import { usePlannerStore } from '@/store/planner-store';
import { useActivityStore } from '@/store/activity-store';
import { useSettingsStore } from '@/store/settings-store';

import { useAcademicYearStore } from '@/store/academic-year-store';
import { useExamsStore } from '@/store/exams-store';
import { useNotesStore } from '@/store/notes-store';

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
      // 1. Resolve academic years first (defaults to Third Year)
      await useAcademicYearStore.getState().fetchAcademicYears();
      const activeYearId = useAcademicYearStore.getState().activeYearId;

      // 2. Fetch year-specific data for the active year and global settings
      const [settings] = await Promise.all([
        useSettingsStore.getState().fetchSettings(),
        useSubjectsStore.getState().fetchSubjects(activeYearId),
        useTasksStore.getState().fetchTasks(activeYearId),
        usePlannerStore.getState().fetchStudyBlocks(activeYearId),
        useActivityStore.getState().fetchActivities(activeYearId),
        useActivityStore.getState().fetchDailyLogs(activeYearId),
        useExamsStore.getState().fetchExams(activeYearId),
        useNotesStore.getState().fetchNotes(activeYearId),
      ]);

      if (settings?.theme) {
        setTheme(settings.theme);
      }
    })();

  }, [setTheme]);

  return null;
}
