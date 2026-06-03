'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { useStoriesStore } from '@/store/stories-store';
import { StoryCard } from '@/components/stories/story-card';
import { StoryModal } from '@/components/stories/story-modal';
import { StoryPlayerBar } from '@/components/stories/story-player-bar';
import { Story } from '@/types';
import { useHydration } from '@/hooks/use-hydration';
import type { Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3 },
  },
};

export default function StoriesPage() {
  const hydrated = useHydration();
  const { stories, fetchStories, loadingStories } = useStoriesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  
  const [playerActive, setPlayerActive] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Playlist is just the stories that have audio
  const playlist = useMemo(() => stories.filter(s => !!s.duration_seconds), [stories]);

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setIsModalOpen(true);
  };

  const handlePlay = (story: Story) => {
    const index = playlist.findIndex(s => s.id === story.id);
    if (index !== -1) {
      setPlayingIndex(index);
      setPlayerActive(true);
    }
  };

  const openNewModal = () => {
    setEditingStory(null);
    setIsModalOpen(true);
  };

  if (!hydrated) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 sm:space-y-8 pb-32"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Sleep Stories"
          description="Relax and drift off with audio stories tailored for winding down after studying."
        />
        
        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Story
        </button>
      </motion.div>

      {/* Stats/Info Card */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Moon className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--foreground))]">Rest Your Mind</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                Listening to stories can help lower your heart rate and prepare your brain for deep, restorative sleep after a long study session.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stories Grid */}
      {loadingStories && stories.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-[hsl(var(--muted-foreground))] animate-pulse text-sm">
            Loading stories...
          </div>
        </div>
      ) : stories.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
            <Moon className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-lg font-semibold">No stories yet</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-sm">
            Create your first sleep story by recording your own voice or uploading an audio file.
          </p>
          <button
            onClick={openNewModal}
            className="mt-6 px-5 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Create Story
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {stories.map((story) => (
            <motion.div key={story.id} variants={itemVariants}>
              <StoryCard
                story={story}
                onEdit={handleEdit}
                onPlay={handlePlay}
                isActive={playerActive && playlist[playingIndex]?.id === story.id}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modals & Player */}
      <StoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingStory={editingStory}
      />

      <StoryPlayerBar
        playlist={playlist}
        isActive={playerActive}
        onClose={() => setPlayerActive(false)}
        startIndex={playingIndex}
      />
    </motion.div>
  );
}
