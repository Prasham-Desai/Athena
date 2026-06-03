'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { Story } from '@/types';
import { useStoriesStore } from '@/store/stories-store';

interface StoryPlayerBarProps {
  playlist: Story[];
  isActive: boolean;
  onClose: () => void;
  startIndex?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StoryPlayerBar({ playlist, isActive, onClose, startIndex = 0 }: StoryPlayerBarProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(startIndex);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const { getStoryAudioUrl } = useStoriesStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStory = playlist[currentStoryIndex] ?? null;
  const currentAudio = currentStory?.audios?.[currentAudioIndex] ?? null;

  // ── Audio element setup ────────────────────────────────────
  const loadTrack = useCallback(
    (storyIdx: number, audioIdx: number, autoplay = true) => {
      if (storyIdx < 0 || storyIdx >= playlist.length) return;
      const story = playlist[storyIdx];
      
      if (!story.audios || story.audios.length === 0) {
        setIsPlaying(false);
        return; // No audio for this story
      }
      
      if (audioIdx < 0 || audioIdx >= story.audios.length) return;
      const audioSegment = story.audios[audioIdx];

      let audio = audioRef.current;
      
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      } else {
        audio.pause();
      }

      audio.src = getStoryAudioUrl(story.id, audioSegment.id);
      audio.load();

      audio.onloadedmetadata = () => {
        if (audio && audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        if (audio) setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        // Auto-play next segment or story
        if (audioIdx < story.audios!.length - 1) {
          loadTrack(storyIdx, audioIdx + 1, true);
        } else if (storyIdx < playlist.length - 1) {
          loadTrack(storyIdx + 1, 0, true);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };

      audio.onerror = () => {
        console.error('Failed to load audio segment for story:', story.title);
        setIsPlaying(false);
      };

      setCurrentStoryIndex(storyIdx);
      setCurrentAudioIndex(audioIdx);
      setCurrentTime(0);
      setDuration(audioSegment.duration_seconds || 0);

      if (autoplay) {
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playlist, getStoryAudioUrl]
  );

  // Start playback when bar becomes active or startIndex changes
  useEffect(() => {
    if (isActive && playlist.length > 0) {
      setCurrentStoryIndex(startIndex);
      setCurrentAudioIndex(0);
      loadTrack(startIndex, 0, true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, startIndex]);

  // ── Controls ───────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const handlePrev = useCallback(() => {
    if (currentAudioIndex > 0) {
      loadTrack(currentStoryIndex, currentAudioIndex - 1);
    } else if (currentStoryIndex > 0) {
      const prevStory = playlist[currentStoryIndex - 1];
      const prevAudioCount = prevStory.audios?.length || 1;
      loadTrack(currentStoryIndex - 1, prevAudioCount - 1);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [currentStoryIndex, currentAudioIndex, loadTrack, playlist]);

  const handleNext = useCallback(() => {
    if (currentStory && currentAudioIndex < (currentStory.audios?.length || 0) - 1) {
      loadTrack(currentStoryIndex, currentAudioIndex + 1);
    } else if (currentStoryIndex < playlist.length - 1) {
      loadTrack(currentStoryIndex + 1, 0);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentStoryIndex, currentAudioIndex, playlist.length, loadTrack, currentStory]);

  const handleClose = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  // ── Progress click ─────────────────────────────────────────
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audioRef.current.currentTime = ratio * duration;
      setCurrentTime(audioRef.current.currentTime);
    },
    [duration]
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Render ─────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isActive && currentStory && currentAudio && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 sm:px-6 sm:pb-4"
        >
          <div
            className="mx-auto max-w-2xl rounded-2xl shadow-2xl
                       bg-[hsl(var(--card)/0.85)] backdrop-blur-xl
                       border border-indigo-500/30
                       px-4 py-3 sm:px-5 sm:py-3.5"
          >
            <div
              className="relative w-full h-1.5 rounded-full bg-[hsl(var(--border))] mb-4
                         cursor-pointer overflow-hidden"
              onClick={handleProgressClick}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full
                           bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Track info */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAudio.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="text-sm sm:text-base font-semibold text-[hsl(var(--foreground))] truncate">
                      {currentStory.title} <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">(Part {currentAudioIndex + 1})</span>
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      <span className="tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <span className="mx-2">·</span>
                      <span className="tabular-nums">
                        Story {currentStoryIndex + 1} / {playlist.length}
                      </span>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Previous */}
                <button
                  onClick={handlePrev}
                  disabled={currentStoryIndex === 0 && currentAudioIndex === 0}
                  className="flex items-center justify-center w-10 h-10 rounded-xl
                             text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]
                             disabled:opacity-30 disabled:cursor-not-allowed
                             transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14
                             rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white
                             hover:opacity-90 active:scale-95 transition-all shadow-lg
                             shadow-indigo-500/30"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={handleNext}
                  disabled={currentStoryIndex >= playlist.length - 1 && currentAudioIndex >= ((currentStory.audios?.length || 1) - 1)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl
                             text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]
                             disabled:opacity-30 disabled:cursor-not-allowed
                             transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Close */}
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-8 h-8 rounded-xl ml-2
                             text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]
                             hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
