'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Repeat } from 'lucide-react';

interface PlaylistItem {
  topicId: string;
  topicName: string;
  noteId: string;
}

interface AudioAutoplayBarProps {
  playlist: PlaylistItem[];
  isActive: boolean;
  onClose: () => void;
  startIndex?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioAutoplayBar({ playlist, isActive, onClose, startIndex = 0 }: AudioAutoplayBarProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);

  // We need a ref for isAutoPlayEnabled to use inside the closure
  const isAutoPlayRef = useRef(isAutoPlayEnabled);
  useEffect(() => {
    isAutoPlayRef.current = isAutoPlayEnabled;
  }, [isAutoPlayEnabled]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrack = playlist[currentIndex] ?? null;

  // ── Audio element setup ────────────────────────────────────
  const loadTrack = useCallback(
    (index: number, autoplay = true) => {
      if (index < 0 || index >= playlist.length) return;

      const track = playlist[index];
      let audio = audioRef.current;
      
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      } else {
        audio.pause();
      }

      audio.src = `/api/audio-notes/${track.noteId}`;
      audio.load();

      audio.onloadedmetadata = () => {
        // Only update if duration is actually valid and track.duration is missing
        if (audio && audio.duration && isFinite(audio.duration) && !track.duration) {
          setDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        if (audio) setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        if (isAutoPlayRef.current) {
          if (index < playlist.length - 1) {
            loadTrack(index + 1, true);
          } else {
            setIsPlaying(false);
            setShowComplete(true);
            completeTimerRef.current = setTimeout(() => {
              setShowComplete(false);
              onClose();
            }, 2000);
          }
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };

      audio.onerror = () => {
        console.error('Failed to load audio for topic:', track.topicName);
        if (isAutoPlayRef.current) {
          if (index < playlist.length - 1) {
            loadTrack(index + 1, true);
          } else {
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      };

      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(track.duration || 0);

      if (autoplay) {
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playlist]
  );

  // Start playback when bar becomes active or startIndex changes
  useEffect(() => {
    if (isActive && playlist.length > 0) {
      setShowComplete(false);
      setCurrentIndex(startIndex);
      loadTrack(startIndex, true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
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
    if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
    } else if (audioRef.current) {
      // Restart current track
      audioRef.current.currentTime = 0;
    }
  }, [currentIndex, loadTrack]);

  const handleNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      loadTrack(currentIndex + 1);
    } else {
      if (isAutoPlayRef.current) {
        setIsPlaying(false);
        setShowComplete(true);
        completeTimerRef.current = setTimeout(() => {
          setShowComplete(false);
          onClose();
        }, 2000);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  }, [currentIndex, playlist.length, loadTrack, onClose]);

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
      {isActive && (
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
                       border border-[hsl(var(--border)/0.5)]
                       px-4 py-3 sm:px-5 sm:py-3.5"
          >
            <div
              className="relative w-full h-1.5 rounded-full bg-[hsl(var(--border))] mb-4
                         cursor-pointer overflow-hidden"
              onClick={handleProgressClick}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full
                           bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(243,75%,70%)]"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Track info */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {showComplete ? (
                    <motion.p
                      key="complete"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs font-medium text-emerald-500"
                    >
                      ✓ Playlist complete
                    </motion.p>
                  ) : currentTrack ? (
                    <motion.div
                      key={currentTrack.topicId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p className="text-sm sm:text-base font-semibold text-[hsl(var(--foreground))] truncate">
                        {currentTrack.topicName}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        <span className="tabular-nums">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <span className="mx-2">·</span>
                        <span className="tabular-nums">
                          {currentIndex + 1} / {playlist.length}
                        </span>
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Auto Play Toggle */}
                <button
                  onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                             ${isAutoPlayEnabled 
                               ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.1] hover:bg-[hsl(var(--primary))/0.15]' 
                               : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`}
                  title={isAutoPlayEnabled ? "Auto-play: ON" : "Auto-play: OFF"}
                >
                  <Repeat className="w-5 h-5" />
                </button>

                {/* Previous */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
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
                             rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
                             hover:opacity-90 active:scale-95 transition-all shadow-lg
                             shadow-[hsl(var(--primary)/0.3)]"
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
                  disabled={currentIndex >= playlist.length - 1}
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
