'use client';

import { Story } from '@/types';
import { motion } from 'framer-motion';
import { Headphones, MoreVertical, Edit2, Trash2, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useStoriesStore } from '@/store/stories-store';

interface StoryCardProps {
  story: Story;
  onEdit: (story: Story) => void;
  onPlay: (story: Story) => void;
  isActive?: boolean;
}

function formatTime(seconds: number | null): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StoryCard({ story, onEdit, onPlay, isActive }: StoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { deleteStory } = useStoriesStore();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this story?')) {
      await deleteStory(story.id);
    }
  };

  const hasAudio = !!story.duration_seconds;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border p-5 transition-all duration-300",
        isActive 
          ? "border-indigo-500 shadow-md shadow-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-500/10" 
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] hover:shadow-md"
      )}
    >
      {/* Decorative gradient for stories */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Headphones className="w-5 h-5 text-white" />
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)} 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl z-50 overflow-hidden py-1"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(story);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <h3 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] truncate mb-1">
          {story.title}
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
          {story.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer / Controls */}
      <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Duration
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatTime(story.duration_seconds)}
          </span>
        </div>

        {hasAudio ? (
          <button
            onClick={() => onPlay(story)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[hsl(var(--primary)/0.2)]"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Play
          </button>
        ) : (
          <button
            onClick={() => onEdit(story)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
          >
            Record Audio
          </button>
        )}
      </div>
    </div>
  );
}
