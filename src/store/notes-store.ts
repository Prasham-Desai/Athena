import { create } from 'zustand';
import type { NoteDocument } from '@/types';
import { useAcademicYearStore } from './academic-year-store';

interface NotesState {
  notes: NoteDocument[];
  activeSubjectId: string | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  fetchNotes: (academicYearId?: string, subjectId?: string) => Promise<NoteDocument[]>;
  uploadNote: (formData: FormData) => Promise<NoteDocument>;
  updateNote: (id: string, updates: { title?: string; subtitle?: string; chapter_id?: string | null; topic_id?: string | null }) => Promise<NoteDocument>;
  deleteNote: (id: string) => Promise<void>;
  setActiveSubjectId: (subjectId: string | null) => void;
}

let notesFetchId = 0;

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeSubjectId: null,
  isLoading: false,
  isUploading: false,
  error: null,

  fetchNotes: async (academicYearId?: string, subjectId?: string) => {
    const requestId = ++notesFetchId;
    set({ isLoading: true, error: null });
    try {
      const yearId =
        academicYearId ||
        (typeof window !== 'undefined'
          ? useAcademicYearStore.getState().activeYearId
          : 'year_3');

      const params = new URLSearchParams();
      if (yearId) params.set('academic_year_id', yearId);
      if (subjectId) params.set('subject_id', subjectId);

      const res = await fetch(`/api/notes?${params.toString()}`);
      const data: any = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch notes');
      }

      const list: NoteDocument[] = data.data || [];
      if (requestId === notesFetchId) set({ notes: list, isLoading: false });
      return list;
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      if (requestId === notesFetchId) set({ error: err.message, isLoading: false });
      return [];
    }
  },

  uploadNote: async (formData: FormData) => {
    set({ isUploading: true, error: null });
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        body: formData,
      });

      const data: any = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document');
      }

      const created: NoteDocument = data.data;
      set((state) => ({
        notes: [created, ...state.notes],
        isUploading: false,
      }));

      return created;
    } catch (err: any) {
      set({ isUploading: false, error: err.message });
      throw err;
    }
  },

  updateNote: async (id: string, updates: { title?: string; subtitle?: string; chapter_id?: string | null; topic_id?: string | null }) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data: any = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update note details');
      }

      const updated: NoteDocument = data.data;
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
      }));

      return updated;
    } catch (err: any) {
      console.error('Error updating note:', err);
      throw err;
    }
  },

  deleteNote: async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      const data: any = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete note');
      }

      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (err: any) {
      console.error('Error deleting note:', err);
      throw err;
    }
  },

  setActiveSubjectId: (subjectId: string | null) => {
    set({ activeSubjectId: subjectId });
  },
}));
