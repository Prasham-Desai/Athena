'use client';

import { useEffect, useRef, useState } from 'react';
import { useSubjectsStore } from '@/store/subjects-store';
import { usePlannerStore } from '@/store/planner-store';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { mockSubjects, mockStudyBlocks, mockTasks, mockActivities, mockDailyLogs } from '@/lib/mock-data';

/**
 * Component that seeds mock data on first launch.
 * Only runs once when localStorage is empty.
 */
export function DataSeeder() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Check if data already exists
    const hasSubjects = localStorage.getItem('study-tracker-subjects');
    if (hasSubjects) return;

    // Seed mock data
    setTimeout(() => {
      useSubjectsStore.getState().setSubjects(mockSubjects);
      usePlannerStore.getState().setStudyBlocks(mockStudyBlocks);
      useTasksStore.getState().setTasks(mockTasks);
      useActivityStore.getState().setActivities(mockActivities);
      useActivityStore.getState().setDailyLogs(mockDailyLogs);
    }, 100);
  }, []);

  return null;
}
