import { create } from 'zustand';
import type { StudyBlock, Priority } from '@/types';
import { generateId } from '@/lib/utils';

interface PlannerState {
  studyBlocks: StudyBlock[];
  fetchStudyBlocks: () => Promise<void>;
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

  const payload = await response.json();
  return payload.data as StudyBlock;
}

export const usePlannerStore = create<PlannerState>()((set, get) => ({
  studyBlocks: [],

  fetchStudyBlocks: async () => {
    try {
      const response = await fetch('/api/study-blocks');
      if (!response.ok) return;

      const payload = await response.json();
      if (payload?.data) {
        set({ studyBlocks: payload.data as StudyBlock[] });
      }
    } catch (error) {
      console.error('Failed to fetch study blocks', error);
    }
  },

  addStudyBlock: async (block) => {
    const newBlock: StudyBlock = { ...block, id: generateId() };
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

  setStudyBlocks: (blocks) => set({ studyBlocks: blocks }),
}));
