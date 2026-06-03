'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Story } from '@/types';
import { useStoriesStore } from '@/store/stories-store';
import { StoryAudioRecorder } from './story-audio-recorder';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStory?: Story | null;
  defaultType?: 'story' | 'imagination';
}

export function StoryModal({ isOpen, onClose, editingStory, defaultType = 'story' }: StoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { createStory, updateStory } = useStoriesStore();

  useEffect(() => {
    if (isOpen) {
      if (editingStory) {
        setTitle(editingStory.title);
        setDescription(editingStory.description || '');
      } else {
        setTitle('');
        setDescription('');
      }
    }
  }, [isOpen, editingStory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (editingStory) {
        await updateStory(editingStory.id, title.trim(), description.trim());
      } else {
        await createStory(title.trim(), description.trim(), defaultType);
      }
      onClose(); // Close the modal upon success
    } catch (error) {
      console.error('Failed to save story details', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-2xl rounded-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
              <h2 className="text-lg font-semibold">
                {editingStory ? 'Edit Story' : 'New Story'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <form id="story-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., The Calm Forest"
                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of this story..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[hsl(var(--muted))/0.5] border-t border-[hsl(var(--border))]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
              >
                Cancel
              </button>
              
              <button
                form="story-form"
                type="submit"
                disabled={!title.trim() || isSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[hsl(var(--primary)/0.2)]"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Details
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
