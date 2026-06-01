import { create } from 'zustand';
import type { AudioNoteMeta } from '@/types';

interface AudioState {
  // Map of subtopic_id -> AudioNoteMeta
  audioNotes: Record<string, AudioNoteMeta>;
  // Subtopic IDs currently loading (array instead of Set for Zustand compatibility)
  loadingSubtopics: string[];

  // Actions
  fetchAudioNotesForTopic: (topicId: string) => Promise<void>;
  saveAudioNote: (subtopicId: string, audioBlob: Blob, durationSeconds: number) => Promise<void>;
  deleteAudioNote: (subtopicId: string) => Promise<void>;
  getAudioUrl: (noteId: string) => string;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioNotes: {},
  loadingSubtopics: [],

  fetchAudioNotesForTopic: async (topicId: string) => {
    try {
      const response = await fetch(`/api/audio-notes?topic_id=${topicId}`);
      if (response.ok) {
        const { data } = (await response.json()) as { data: AudioNoteMeta[] };
        if (data && data.length > 0) {
          set((state) => {
            const updated = { ...state.audioNotes };
            for (const note of data) {
              updated[note.subtopic_id] = note;
            }
            return { audioNotes: updated };
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch audio notes for topic', error);
    }
  },

  saveAudioNote: async (subtopicId: string, audioBlob: Blob, durationSeconds: number) => {
    // Mark as loading
    set((state) => ({
      loadingSubtopics: [...state.loadingSubtopics, subtopicId],
    }));

    try {
      // Convert Blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audio_data = btoa(binary);

      const response = await fetch('/api/audio-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopic_id: subtopicId,
          audio_data,
          mime_type: audioBlob.type || 'audio/webm;codecs=opus',
          duration_seconds: durationSeconds,
        }),
      });

      if (!response.ok) throw new Error('Failed to save audio note');

      const { data } = (await response.json()) as { data: AudioNoteMeta };

      // Update store with the new note
      set((state) => ({
        audioNotes: { ...state.audioNotes, [subtopicId]: data },
        loadingSubtopics: state.loadingSubtopics.filter((id) => id !== subtopicId),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Audio note saved', type: 'success' },
          })
        );
      }
    } catch (error) {
      // Remove loading state
      set((state) => ({
        loadingSubtopics: state.loadingSubtopics.filter((id) => id !== subtopicId),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to save audio note', type: 'error' },
          })
        );
      }
      console.error('Failed to save audio note', error);
      throw error;
    }
  },

  deleteAudioNote: async (subtopicId: string) => {
    const previousNotes = get().audioNotes;
    const note = previousNotes[subtopicId];

    if (!note) return;

    // Optimistic removal
    set((state) => {
      const updated = { ...state.audioNotes };
      delete updated[subtopicId];
      return { audioNotes: updated };
    });

    try {
      const response = await fetch(`/api/audio-notes/${note.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete audio note');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Audio note deleted', type: 'success' },
          })
        );
      }
    } catch (error) {
      // Rollback
      set({ audioNotes: previousNotes });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to delete audio note', type: 'error' },
          })
        );
      }
      console.error('Failed to delete audio note', error);
      throw error;
    }
  },

  getAudioUrl: (noteId: string) => {
    return `/api/audio-notes/${noteId}`;
  },
}));
