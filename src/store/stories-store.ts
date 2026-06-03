import { create } from 'zustand';
import type { Story } from '@/types';

interface StoriesState {
  stories: Story[];
  loadingStories: boolean;
  loadingStoryIds: string[];

  // Actions
  fetchStories: () => Promise<void>;
  createStory: (title: string, description?: string, type?: 'story' | 'imagination') => Promise<Story>;
  updateStory: (id: string, title: string, description?: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  saveStoryAudio: (id: string, audioBlob: Blob, durationSeconds: number) => Promise<void>;
  deleteStoryAudio: (storyId: string, audioId: string) => Promise<void>;
  getStoryAudioUrl: (storyId: string, audioId: string) => string;
}

export const useStoriesStore = create<StoriesState>((set, get) => ({
  stories: [],
  loadingStories: false,
  loadingStoryIds: [],

  fetchStories: async () => {
    set({ loadingStories: true });
    try {
      const response = await fetch('/api/stories');
      if (response.ok) {
        const { data } = (await response.json()) as { data: Story[] };
        set({ stories: data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch stories', error);
    } finally {
      set({ loadingStories: false });
    }
  },

  createStory: async (title: string, description?: string, type?: 'story' | 'imagination') => {
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type }),
      });

      if (!response.ok) throw new Error('Failed to create story');

      const { data } = (await response.json()) as { data: Story };
      set((state) => ({ stories: [data, ...state.stories] }));
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Story created', type: 'success' },
          })
        );
      }
      return data;
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to create story', type: 'error' },
          })
        );
      }
      console.error('Failed to create story', error);
      throw error;
    }
  },

  updateStory: async (id: string, title: string, description?: string) => {
    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) throw new Error('Failed to update story');

      const { data } = (await response.json()) as { data: Story };
      set((state) => ({
        stories: state.stories.map((s) => (s.id === id ? data : s)),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Story updated', type: 'success' },
          })
        );
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to update story', type: 'error' },
          })
        );
      }
      console.error('Failed to update story', error);
      throw error;
    }
  },

  deleteStory: async (id: string) => {
    const previousStories = get().stories;
    
    // Optimistic removal
    set((state) => ({
      stories: state.stories.filter((s) => s.id !== id),
    }));

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete story');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Story deleted', type: 'success' },
          })
        );
      }
    } catch (error) {
      // Rollback
      set({ stories: previousStories });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to delete story', type: 'error' },
          })
        );
      }
      console.error('Failed to delete story', error);
      throw error;
    }
  },

  saveStoryAudio: async (id: string, audioBlob: Blob, durationSeconds: number) => {
    set((state) => ({
      loadingStoryIds: [...state.loadingStoryIds, id],
    }));

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audio_data = btoa(binary);

      const response = await fetch(`/api/stories/${id}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_data,
          mime_type: audioBlob.type || 'audio/webm;codecs=opus',
          duration_seconds: durationSeconds,
        }),
      });

      if (!response.ok) throw new Error('Failed to save story audio');

      const { data } = (await response.json()) as { data: Story };

      set((state) => ({
        stories: state.stories.map((s) => (s.id === id ? data : s)),
        loadingStoryIds: state.loadingStoryIds.filter((storyId) => storyId !== id),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Story audio saved', type: 'success' },
          })
        );
      }
    } catch (error) {
      set((state) => ({
        loadingStoryIds: state.loadingStoryIds.filter((storyId) => storyId !== id),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to save story audio', type: 'error' },
          })
        );
      }
      console.error('Failed to save story audio', error);
      throw error;
    }
  },

  deleteStoryAudio: async (storyId: string, audioId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/audio/${audioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete story audio');

      const { data } = (await response.json()) as { data: Story };
      
      set((state) => ({
        stories: state.stories.map((s) => (s.id === storyId ? data : s)),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Audio note deleted', type: 'success' },
          })
        );
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Failed to delete audio note', type: 'error' },
          })
        );
      }
      console.error('Failed to delete story audio', error);
      throw error;
    }
  },

  getStoryAudioUrl: (storyId: string, audioId: string) => {
    return `/api/stories/${storyId}/audio?audioId=${audioId}`;
  },
}));
