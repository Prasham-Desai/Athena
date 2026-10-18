import { create } from 'zustand';
import type { AcademicYear } from '@/types';
import { useSubjectsStore } from './subjects-store';
import { useTasksStore } from './tasks-store';
import { usePlannerStore } from './planner-store';
import { useActivityStore } from './activity-store';
import { useExamsStore } from './exams-store';

interface AcademicYearState {
  years: AcademicYear[];
  activeYearId: string;
  activeYear: AcademicYear | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  fetchAcademicYears: () => Promise<AcademicYear[]>;
  setActiveYearId: (yearId: string) => Promise<void>;
}

// Fallback initial years while fetching from API
const INITIAL_YEARS: AcademicYear[] = [
  { id: 'year_2', name: 'Second Year', code: 'second_year', order_index: 2 },
  { id: 'year_3', name: 'Third Year', code: 'third_year', order_index: 3 },
];

export const useAcademicYearStore = create<AcademicYearState>((set, get) => ({
  years: INITIAL_YEARS,
  activeYearId: 'year_3', // Third Year is selected by default
  activeYear: INITIAL_YEARS[1],
  isLoading: false,
  isSwitching: false,
  error: null,

  fetchAcademicYears: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/academic-years');
      if (!response.ok) throw new Error('Failed to load academic years');
      
      const payload: any = await response.json();
      const list: AcademicYear[] = payload.data || [];
      
      if (list.length > 0) {
        // Resolve Third Year dynamically
        const thirdYear = 
          list.find((y) => y.code === 'third_year' || y.name.toLowerCase().includes('third')) ||
          list.find((y) => y.order_index === 3) ||
          list[list.length - 1];

        // Maintain Third Year default unless user already explicitly chose another year in the current session
        const currentActiveId = get().activeYearId;
        const targetYear = (currentActiveId && list.some(y => y.id === currentActiveId))
          ? list.find(y => y.id === currentActiveId)!
          : thirdYear;

        set({
          years: list,
          activeYearId: targetYear.id,
          activeYear: targetYear,
          isLoading: false,
        });

        return list;
      }
      
      set({ isLoading: false });
      return list;
    } catch (err: any) {
      console.error('Error fetching academic years:', err);
      set({ isLoading: false, error: err.message });
      return INITIAL_YEARS;
    }
  },

  setActiveYearId: async (yearId: string) => {
    if (get().activeYearId === yearId && !get().isSwitching) return;

    const targetYear = get().years.find((y) => y.id === yearId) || null;
    set({ activeYearId: yearId, activeYear: targetYear, isSwitching: true });

    try {
      // Invalidate and reload all year-aware stores in parallel
      await Promise.all([
        useSubjectsStore.getState().fetchSubjects(yearId),
        useTasksStore.getState().fetchTasks(yearId),
        usePlannerStore.getState().fetchStudyBlocks(yearId),
        useActivityStore.getState().fetchActivities(yearId),
        useActivityStore.getState().fetchDailyLogs(yearId),
        useExamsStore.getState().fetchExams(yearId),
        (await import('./notes-store')).useNotesStore.getState().fetchNotes(yearId),
      ]);
    } catch (error) {
      console.error('Failed to reload data for academic year', yearId, error);
    } finally {
      set({ isSwitching: false });
    }
  },
}));
