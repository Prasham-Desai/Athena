import { create } from 'zustand';
import type { Exam } from '@/types';
import { getToday } from '@/lib/utils';

interface ExamsState {
  exams: Exam[];
  isLoading: boolean;
  error: string | null;
  fetchExams: () => Promise<void>;
  addExam: (exam: Omit<Exam, 'id' | 'completed'>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  checkCompletedExams: () => Promise<void>;
}

export const useExamsStore = create<ExamsState>((set, get) => ({
  exams: [],
  isLoading: false,
  error: null,

  fetchExams: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/exams');
      const data: any = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch exams');
      
      set({ exams: data.data });
      get().checkCompletedExams();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addExam: async (examData) => {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData),
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

  checkCompletedExams: async () => {
    const today = getToday();
    const { exams } = get();
    
    let hasChanges = false;
    const updatedExams = [...exams];

    for (let i = 0; i < updatedExams.length; i++) {
      const exam = updatedExams[i];
      if (!exam.completed && exam.date < today) {
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
