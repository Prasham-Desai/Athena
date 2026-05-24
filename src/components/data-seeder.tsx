'use client';

import { useEffect, useRef } from 'react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useTasksStore } from '@/store/tasks-store';

/**
 * Component that hydrates the application data from the Cloudflare API.
 */
export function DataSeeder() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Fetch initial data from the Cloudflare Edge API
    useSubjectsStore.getState().fetchSubjects();
    useTasksStore.getState().fetchTasks();

  }, []);

  return null;
}
