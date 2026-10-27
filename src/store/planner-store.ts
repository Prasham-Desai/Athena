import { create } from 'zustand';
import type { StudyBlock, Priority } from '@/types';
import { generateId } from '@/lib/utils';

interface PlannerState {
  studyBlocks: StudyBlock[];
  cacheByYear: Record<string, StudyBlock[]>;
  isLoading: boolean;
  fetchStudyBlocks: (academicYearId?: string, force?: boolean) => Promise<void>;
  addStudyBlock: (block: Omit<StudyBlock, 'id'>) => Promise<void>;
  updateStudyBlock: (id: string, updates: Partial<StudyBlock>) => Promise<void>;
  deleteStudyBlock: (id: string) => Promise<void>;
  toggleStudyBlock: (id: string) => Promise<void>;
  getBlocksByDate: (date: string) => StudyBlock[];
  reorderBlocks: (blocks: StudyBlock[]) => Promise<void>;
  setStudyBlocks: (blocks: StudyBlock[]) => void;
}

async function saveStudyBlock(block: StudyBlock, method: 'POST' | 'PUT' = 'POST') {
  const response = await fetch(method === 'POST' ? '/api/study-blocks' : `/api/study-blocks/${block.id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(block),
  });

  if (!response.ok) {
    throw new Error('Failed to save study block');
  }

  const payload = (await response.json()) as { data?: StudyBlock };
  return payload.data as StudyBlock;
}

let studyBlocksFetchId = 0;
const inFlightBlocksMap = new Map<string, Promise<any>>();

export const usePlannerStore = create<PlannerState>()((set, get) => ({
  studyBlocks: [],
  cacheByYear: {},
  isLoading: false,

  fetchStudyBlocks: async (academicYearId?: string, force?: boolean) => {
    const activeYearStore = (await import('./academic-year-store')).useAcademicYearStore;
    const yearId = academicYearId || (typeof window !== 'undefined' ? activeYearStore.getState().activeYearId : 'year_3');

    const cached = get().cacheByYear[yearId];
    const isCurrentActive = typeof window !== 'undefined'
      ? activeYearStore.getState().activeYearId === yearId
      : true;

    if (cached && !force) {
      if (isCurrentActive) {
        set({ studyBlocks: cached, isLoading: false });
      }
      return;
    }

    if (inFlightBlocksMap.has(yearId)) {
      return inFlightBlocksMap.get(yearId);
    }

    const requestId = ++studyBlocksFetchId;
    if (isCurrentActive && !cached) {
      set({ isLoading: true });
    }

    const promise = (async () => {
      try {
        const url = yearId ? `/api/study-blocks?academic_year_id=${yearId}` : '/api/study-blocks';
        const response = await fetch(url);
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: StudyBlock[] };
        if (payload?.data) {
          const loaded = payload.data as StudyBlock[];
          set((state) => {
            const currentYear = activeYearStore.getState().activeYearId;
            return {
              cacheByYear: { ...state.cacheByYear, [yearId]: loaded },
              studyBlocks: (currentYear === yearId || !currentYear) ? loaded : state.studyBlocks,
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch study blocks', error);
      } finally {
        if (requestId === studyBlocksFetchId) set({ isLoading: false });
        inFlightBlocksMap.delete(yearId);
      }
    })();

    inFlightBlocksMap.set(yearId, promise);
    return promise;
  },

  addStudyBlock: async (block) => {
    const yearId = (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId || 'year_3';
    const newBlock: StudyBlock = {
      ...block,
      id: generateId(),
      academicYearId: yearId,
      academic_year_id: yearId,
    };
    set((state) => ({ studyBlocks: [...state.studyBlocks, newBlock] }));

    try {
      await saveStudyBlock(newBlock, 'POST');
    } catch (error) {
      console.error('Failed to save study block', error);
    }
  },

  updateStudyBlock: async (id, updates) => {
    const nextBlock = get().studyBlocks.find((block) => block.id === id);
    if (!nextBlock) return;

    const merged = { ...nextBlock, ...updates };
    set((state) => ({
      studyBlocks: state.studyBlocks.map((block) => (block.id === id ? merged : block)),
    }));

    try {
      await saveStudyBlock(merged, 'PUT');
    } catch (error) {
      console.error('Failed to update study block', error);
    }
  },

  deleteStudyBlock: async (id) => {
    set((state) => ({
      studyBlocks: state.studyBlocks.filter((block) => block.id !== id),
    }));

    try {
      const response = await fetch(`/api/study-blocks/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete study block');
      }
    } catch (error) {
      console.error('Failed to delete study block', error);
    }
  },

  toggleStudyBlock: async (id) => {
    const current = get().studyBlocks.find((block) => block.id === id);
    if (!current) return;

    await get().updateStudyBlock(id, { completed: !current.completed });
  },

  getBlocksByDate: (date) => get().studyBlocks.filter((block) => block.date === date),

  reorderBlocks: async (blocks) => {
    set({ studyBlocks: blocks });

    try {
      await Promise.all(blocks.map((block) => saveStudyBlock(block, 'PUT')));
    } catch (error) {
      console.error('Failed to reorder study blocks', error);
    }
  },

  setStudyBlocks: (blocks) => {
    const yearId = blocks[0]?.academic_year_id || blocks[0]?.academicYearId;
    set((state) => ({
      studyBlocks: blocks,
      cacheByYear: yearId ? { ...state.cacheByYear, [yearId]: blocks } : state.cacheByYear,
    }));
  },
}));
