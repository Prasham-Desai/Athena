import { create } from 'zustand';
import type { AcademicYear } from '@/types';
import { useSubjectsStore } from './subjects-store';
import { useTasksStore } from './tasks-store';
import { usePlannerStore } from './planner-store';
import { useActivityStore } from './activity-store';
import { useExamsStore } from './exams-store';

// ---------------------------------------------------------------------------
// localStorage key and helpers
// ---------------------------------------------------------------------------
const LS_YEAR_KEY = 'athena_active_year_id';

function readPersistedYearId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LS_YEAR_KEY);
  } catch {
    return null;
  }
}

function persistYearId(yearId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_YEAR_KEY, yearId);
  } catch {
    // ignore storage quota / security errors
  }
}

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

// Restore from localStorage if available, otherwise fall back to year_3.
const _restoredYearId = readPersistedYearId() ?? 'year_3';
const _restoredYear = INITIAL_YEARS.find((y) => y.id === _restoredYearId) ?? INITIAL_YEARS[1];

export const useAcademicYearStore = create<AcademicYearState>((set, get) => ({
  years: INITIAL_YEARS,
  activeYearId: _restoredYearId,
  activeYear: _restoredYear,
  isLoading: true,
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
        // Resolve Third Year dynamically (used as final fallback only)
        const thirdYear = 
          list.find((y) => y.code === 'third_year' || y.name.toLowerCase().includes('third')) ||
          list.find((y) => y.order_index === 3) ||
          list[list.length - 1];

        // Honour the persisted / in-memory selection if it exists in the
        // freshly-fetched list; fall back to Third Year only when the stored
        // value is unknown (e.g. first-ever visit or stale id).
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

    // Persist the manual selection so ordinary reloads restore it.
    persistYearId(yearId);

    // Clear collections that belong exclusively to the previous year so
    // destination pages cannot briefly render stale subjects or schedules.
    useSubjectsStore.setState({ subjects: [], isLoading: true });
    useTasksStore.setState({ tasks: [], isLoading: true });
    usePlannerStore.setState({ studyBlocks: [], isLoading: true });
    useActivityStore.setState({
      activities: [],
      dailyLogs: [],
      isLoadingActivities: true,
      isLoadingDailyLogs: true,
    });
    useExamsStore.setState({ exams: [], isLoading: true, error: null });

    try {
      // Invalidate and reload all year-aware stores in parallel
      const { useNotesStore } = await import('./notes-store');
      useNotesStore.setState({ notes: [], activeSubjectId: null, isLoading: true, error: null });
      await Promise.all([
        useSubjectsStore.getState().fetchSubjects(yearId),
        useTasksStore.getState().fetchTasks(yearId),
        usePlannerStore.getState().fetchStudyBlocks(yearId),
        useActivityStore.getState().fetchActivities(yearId),
        useActivityStore.getState().fetchDailyLogs(yearId),
        useExamsStore.getState().fetchExams(yearId),
        useNotesStore.getState().fetchNotes(yearId),
      ]);
    } catch (error) {
      console.error('Failed to reload data for academic year', yearId, error);
    } finally {
      set({ isSwitching: false });
    }
  },
}));
