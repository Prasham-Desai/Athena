import { create } from 'zustand';
import type { AudioNoteMeta } from '@/types';

interface AudioState {
  // Map of topic_id -> AudioNoteMeta
  audioNotes: Record<string, AudioNoteMeta>;
  // Topic IDs currently loading
  loadingTopics: string[];

  // Actions
  fetchAudioNotesForChapter: (chapterId: string) => Promise<void>;
  saveAudioNote: (topicId: string, audioBlob: Blob, durationSeconds: number) => Promise<void>;
  deleteAudioNote: (topicId: string) => Promise<void>;
  getAudioUrl: (noteId: string) => string;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioNotes: {},
  loadingTopics: [],

  fetchAudioNotesForChapter: async (chapterId: string) => {
    try {
      const response = await fetch(`/api/audio-notes?chapter_id=${chapterId}`);
      if (response.ok) {
        const { data } = (await response.json()) as { data: AudioNoteMeta[] };
        if (data && data.length > 0) {
          set((state) => {
            const updated = { ...state.audioNotes };
            for (const note of data) {
              updated[note.topic_id] = note;
            }
            return { audioNotes: updated };
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch audio notes for topic', error);
    }
  },

  saveAudioNote: async (topicId: string, audioBlob: Blob, durationSeconds: number) => {
    // Mark as loading
    set((state) => ({
      loadingTopics: [...state.loadingTopics, topicId],
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
          topic_id: topicId,
          audio_data,
          mime_type: audioBlob.type || 'audio/webm;codecs=opus',
          duration_seconds: durationSeconds,
        }),
      });

      if (!response.ok) throw new Error('Failed to save audio note');

      const { data } = (await response.json()) as { data: AudioNoteMeta };

      // Update store with the new note
      set((state) => ({
        audioNotes: { ...state.audioNotes, [topicId]: data },
        loadingTopics: state.loadingTopics.filter((id) => id !== topicId),
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
        loadingTopics: state.loadingTopics.filter((id) => id !== topicId),
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

  deleteAudioNote: async (topicId: string) => {
    const previousNotes = get().audioNotes;
    const note = previousNotes[topicId];

    if (!note) return;

    // Optimistic removal
    set((state) => {
      const updated = { ...state.audioNotes };
      delete updated[topicId];
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
