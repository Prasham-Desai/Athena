'use client';

import { Story } from '@/types';
import { Headphones, MoreVertical, Edit2, Trash2, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useStoriesStore } from '@/store/stories-store';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { StoryAudioRecorder } from './story-audio-recorder';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { ConfirmModal } from '@/components/shared/confirm-modal';

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
  const { deleteStory, deleteStoryAudio } = useStoriesStore();
  const [isRecording, setIsRecording] = useState(false);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const handleDelete = () => {
    setConfirmState({
      title: 'Delete Story',
      message: 'Are you sure you want to delete this story? This action cannot be undone.',
      onConfirm: async () => {
        await deleteStory(story.id);
      }
    });
  };

  const totalDuration = story.audios?.reduce((sum, a) => sum + a.duration_seconds, 0) || 0;
  const hasAudio = story.audios && story.audios.length > 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border p-5 transition-all duration-300 h-[480px]",
        isActive 
          ? "border-indigo-500 shadow-md shadow-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-500/10" 
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] hover:shadow-md"
      )}
    >
      {/* Decorative gradient for stories */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative z-10 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Headphones className="w-5 h-5 text-white" />
        </div>

        {/* Radix Dropdown Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors relative z-20 outline-none">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="min-w-[120px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl z-[100] overflow-hidden py-1 animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            >
              <DropdownMenu.Item
                onSelect={() => onEdit(story)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] outline-none cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 outline-none cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Content */}
      <div className="shrink-0 mb-4 relative z-10">
        <h3 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] truncate mb-1">
          {story.title}
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed h-[40px]">
          {story.description || 'No description provided.'}
        </p>
      </div>

      {/* Audio List Area (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto mb-4 border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--muted))/0.3] p-2 custom-scrollbar">
        {hasAudio ? (
          <div className="space-y-2">
            {story.audios.map((audio, index) => (
              <div key={audio.id} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-sm text-sm">
                <span className="font-medium text-[hsl(var(--foreground))]">Part {index + 1}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">{formatTime(audio.duration_seconds)}</span>
                  <button
                    onClick={() => {
                      setConfirmState({
                        title: 'Delete Audio Segment',
                        message: 'Are you sure you want to delete this audio segment?',
                        onConfirm: () => deleteStoryAudio(story.id, audio.id)
                      });
                    }}
                    className="text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
            No audio recorded yet.
          </div>
        )}
      </div>

      {/* Add Audio Recorder */}
      {isRecording && (
        <div className="mb-4">
          <StoryAudioRecorder 
            storyId={story.id} 
            compact={true} 
            onSuccess={() => setIsRecording(false)}
          />
        </div>
      )}

      {/* Footer / Controls */}
      <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 relative z-10 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Total Duration
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatTime(totalDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isRecording && (
            <button
              onClick={() => setIsRecording(true)}
              className="p-2 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
              title="Add Audio Segment"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onPlay(story)}
            disabled={!hasAudio}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[hsl(var(--primary)/0.2)] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Play
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm || (() => {})}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmText="Delete"
      />
    </div>
  );
}
