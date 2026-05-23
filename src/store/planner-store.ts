import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudyBlock, Priority } from '@/types';
import { generateId } from '@/lib/utils';

interface PlannerState {
  studyBlocks: StudyBlock[];
  addStudyBlock: (block: Omit<StudyBlock, 'id'>) => void;
  updateStudyBlock: (id: string, updates: Partial<StudyBlock>) => void;
  deleteStudyBlock: (id: string) => void;
  toggleStudyBlock: (id: string) => void;
  getBlocksByDate: (date: string) => StudyBlock[];
  reorderBlocks: (blocks: StudyBlock[]) => void;
  setStudyBlocks: (blocks: StudyBlock[]) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      studyBlocks: [],

      addStudyBlock: (block) =>
        set((state) => ({
          studyBlocks: [
            ...state.studyBlocks,
            { ...block, id: generateId() },
          ],
        })),

      updateStudyBlock: (id, updates) =>
        set((state) => ({
          studyBlocks: state.studyBlocks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      deleteStudyBlock: (id) =>
        set((state) => ({
          studyBlocks: state.studyBlocks.filter((b) => b.id !== id),
        })),

      toggleStudyBlock: (id) =>
        set((state) => ({
          studyBlocks: state.studyBlocks.map((b) =>
            b.id === id ? { ...b, completed: !b.completed } : b
          ),
        })),

      getBlocksByDate: (date) => {
        return get().studyBlocks.filter((b) => b.date === date);
      },

      reorderBlocks: (blocks) => set({ studyBlocks: blocks }),

      setStudyBlocks: (blocks) => set({ studyBlocks: blocks }),
    }),
    {
      name: 'study-tracker-planner-v2',
    }
  )
);
