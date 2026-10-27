import { create } from 'zustand';
import type { Exam } from '@/types';
import { getToday } from '@/lib/utils';

interface ExamsState {
  exams: Exam[];
  cacheByYear: Record<string, Exam[]>;
  isLoading: boolean;
  error: string | null;
  fetchExams: (academicYearId?: string, force?: boolean) => Promise<void>;
  addExam: (exam: Omit<Exam, 'id' | 'completed'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  checkCompletedExams: () => Promise<void>;
}

let examsFetchId = 0;
const inFlightExamsMap = new Map<string, Promise<any>>();

export const useExamsStore = create<ExamsState>((set, get) => ({
  exams: [],
  cacheByYear: {},
  isLoading: false,
  error: null,

  fetchExams: async (academicYearId?: string, force?: boolean) => {
    const activeYearStore = (await import('./academic-year-store')).useAcademicYearStore;
    const yearId = academicYearId || (typeof window !== 'undefined' ? activeYearStore.getState().activeYearId : 'year_3');

    const cached = get().cacheByYear[yearId];
    const isCurrentActive = typeof window !== 'undefined'
      ? activeYearStore.getState().activeYearId === yearId
      : true;

    if (cached && !force) {
      if (isCurrentActive) {
        set({ exams: cached, isLoading: false, error: null });
      }
      return;
    }

    if (inFlightExamsMap.has(yearId)) {
      return inFlightExamsMap.get(yearId);
    }

    const requestId = ++examsFetchId;
    if (isCurrentActive && !cached) {
      set({ isLoading: true, error: null });
    }

    const promise = (async () => {
      try {
        const url = yearId ? `/api/exams?academic_year_id=${yearId}` : '/api/exams';
        const res = await fetch(url);
        const data: any = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch exams');
        
        const list: Exam[] = data.data || [];
        if (requestId === examsFetchId) {
          set((state) => {
            const currentYear = activeYearStore.getState().activeYearId;
            return {
              cacheByYear: { ...state.cacheByYear, [yearId]: list },
              exams: (currentYear === yearId || !currentYear) ? list : state.exams,
            };
          });
          get().checkCompletedExams();
        }
      } catch (error: any) {
        if (requestId === examsFetchId) set({ error: error.message });
      } finally {
        if (requestId === examsFetchId) set({ isLoading: false });
        inFlightExamsMap.delete(yearId);
      }
    })();

    inFlightExamsMap.set(yearId, promise);
    return promise;
  },

  addExam: async (examData) => {
    try {
      const yearId = (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId || 'year_3';
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...examData, academicYearId: yearId, academic_year_id: yearId }),
      });
      const data: any = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create exam');
      
      set((state) => ({ exams: [...state.exams, data.data].sort((a, b) => a.date > b.date ? 1 : -1) }));
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  deleteExam: async (id) => {
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      const data: any = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete exam');
      
      set((state) => ({ exams: state.exams.filter((e) => e.id !== id) }));
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  updateExam: async (id, examData) => {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData),
      });
      const data: any = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update exam');
      
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, ...examData } : e)).sort((a, b) => a.date > b.date ? 1 : -1)
      }));
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  checkCompletedExams: async () => {
    const today = getToday();
    const { exams } = get();
    
    let hasChanges = false;
    const updatedExams = [...exams];

    for (let i = 0; i < updatedExams.length; i++) {
      const exam = updatedExams[i];
      if (!exam.completed && exam.date && exam.date < today) {
        // Date has passed
        try {
          await fetch(`/api/exams/${exam.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true }),
          });
          updatedExams[i] = { ...exam, completed: true };
          hasChanges = true;
        } catch (error) {
          console.error('Failed to mark exam completed', error);
        }
      }
    }

    if (hasChanges) {
      set({ exams: updatedExams });
    }
  }
}));
