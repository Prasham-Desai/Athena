'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, RefreshCcw, Trash2, Loader2 } from 'lucide-react';
import { useAudioStore } from '@/store/audio-store';

interface AudioRecorderProps {
  topicId: string;
  topicName: string;
  compact?: boolean;
  onPlayGlobal?: () => void;
}

type RecorderState = 'idle' | 'recording' | 'pending-save' | 'has-audio' | 'playing';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioRecorder({ topicId, topicName, compact = true, onPlayGlobal }: AudioRecorderProps) {
  const { audioNotes, loadingTopics, saveAudioNote, deleteAudioNote, getAudioUrl } =
    useAudioStore();

  const existingNote = audioNotes[topicId];
  const isLoading = loadingTopics.includes(topicId);

  // State
  const [recorderState, setRecorderState] = useState<RecorderState>(
    existingNote ? 'has-audio' : 'idle'
  );
  const [elapsed, setElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(existingNote?.duration_seconds ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartRef = useRef<number>(0);

  // Sync with store when existingNote changes
  useEffect(() => {
    if (existingNote && recorderState === 'idle') {
      setRecorderState('has-audio');
      setDuration(existingNote.duration_seconds);
    } else if (!existingNote && (recorderState === 'has-audio' || recorderState === 'playing')) {
      setRecorderState('idle');
    }
  }, [existingNote]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ── Recording ──────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const exactDuration = (Date.now() - recordingStartRef.current) / 1000;
        
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Enter review state instead of saving immediately
        setPendingBlob(blob);
        setPendingDuration(exactDuration);
        setRecorderState('pending-save');
      };

      mediaRecorder.start(250); // collect chunks every 250ms
      setElapsed(0);
      setRecorderState('recording');

      // Elapsed timer
      recordingStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 250);
    } catch (err) {
      console.error('Microphone access denied', err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Microphone access denied', type: 'error' },
          })
        );
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Playback ───────────────────────────────────────────────
  const startPlayback = useCallback(() => {
    if (onPlayGlobal) {
      onPlayGlobal();
      return;
    }

    if (!existingNote) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(getAudioUrl(existingNote.id));

      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime ?? 0);
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        setRecorderState('has-audio');
        setCurrentTime(0);
      });

      audioRef.current.addEventListener('error', () => {
        console.error('Failed to load audio note');
        setRecorderState('has-audio');
        setCurrentTime(0);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('toast', { detail: { message: 'Failed to load audio file', type: 'error' } })
          );
        }
      });
    }

    audioRef.current.play();
    setRecorderState('playing');
  }, [existingNote, getAudioUrl]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setRecorderState('has-audio');
  }, []);

  const togglePlayback = useCallback(() => {
    if (recorderState === 'playing') {
      pausePlayback();
    } else {
      startPlayback();
    }
  }, [recorderState, startPlayback, pausePlayback]);

  // ── Re-record ──────────────────────────────────────────────
  const handleReRecord = useCallback(() => {
    if (window.confirm('Are you sure you want to discard the current note and re-record?')) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setCurrentTime(0);
      startRecording();
    }
  }, [startRecording]);

  // ── Save / Discard Pending ─────────────────────────────────
  const handleSavePending = useCallback(async () => {
    if (!pendingBlob) return;
    try {
      await saveAudioNote(topicId, pendingBlob, pendingDuration);
      setRecorderState('has-audio');
      setDuration(pendingDuration);
    } catch {
      // Revert if failed
      setRecorderState(existingNote ? 'has-audio' : 'idle');
    } finally {
      setPendingBlob(null);
    }
  }, [pendingBlob, pendingDuration, saveAudioNote, topicId, existingNote]);

  const handleDiscardPending = useCallback(() => {
    setPendingBlob(null);
    setRecorderState(existingNote ? 'has-audio' : 'idle');
  }, [existingNote]);

  // ── Delete ─────────────────────────────────────────────────
  const handleDeleteClick = useCallback(() => {
    if (confirmDelete) {
      // Confirmed — delete
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setCurrentTime(0);
      setConfirmDelete(false);
      deleteAudioNote(topicId);
    } else {
      setConfirmDelete(true);
      confirmTimerRef.current = setTimeout(() => setConfirmDelete(false), 2500);
    }
  }, [confirmDelete, topicId, deleteAudioNote]);

  // ── Progress bar click ─────────────────────────────────────
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
    <div className={`flex items-center ${compact ? 'mt-1' : 'mt-2'}`}>
      <AnimatePresence mode="wait">
        {/* ── Loading ──────────────────────────────────────── */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[0.65rem]">Saving…</span>
          </motion.div>
        )}

        {/* ── Idle: Mic button ─────────────────────────────── */}
        {!isLoading && recorderState === 'idle' && (
          <motion.button
            key="idle"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={startRecording}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.15] border border-[hsl(var(--primary))/0.2] transition-colors duration-150 w-fit"
            title={`Record audio for ${topicName}`}
          >
            <Mic className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Record Note
            </span>
          </motion.button>
        )}

        {/* ── Recording ────────────────────────────────────── */}
        {!isLoading && recorderState === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                       bg-red-500/10 border border-red-500/20"
          >
            {/* Pulsing mic */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mic className="w-3.5 h-3.5 text-red-500" />
            </motion.div>

            {/* Waveform bars */}
            <div className="flex items-center gap-[2px] h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full bg-red-500"
                  animate={{
                    height: ['4px', '14px', '6px', '12px', '4px'],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.12,
                  }}
                />
              ))}
            </div>

            {/* Elapsed time */}
            <span className="text-xs sm:text-sm font-medium text-red-500 tabular-nums min-w-[2.5rem] ml-1">
              {formatTime(elapsed)}
            </span>

            {/* Stop button */}
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md ml-1
                         bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              title="Stop Recording"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
            </button>
          </motion.div>
        )}

        {/* ── Pending Save (Review) ────────────────────────── */}
        {!isLoading && recorderState === 'pending-save' && (
          <motion.div
            key="pending-save"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                       bg-amber-500/10 border border-amber-500/20"
          >
            <span className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">
              Review: {formatTime(pendingDuration)}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              {/* Discard */}
              <button
                onClick={handleDiscardPending}
                className="px-2.5 py-1 text-xs font-medium rounded-md
                           bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] 
                           hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Discard
              </button>
              {/* Save */}
              <button
                onClick={handleSavePending}
                className="px-3 py-1 text-xs font-medium rounded-md shadow-sm
                           bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Has Audio / Playing ──────────────────────────── */}
        {!isLoading && (recorderState === 'has-audio' || recorderState === 'playing') && (
          <motion.div
            key="has-audio"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                       bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"
          >
            {/* Play/Pause */}
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md
                         bg-emerald-500/15 text-emerald-600 dark:text-emerald-400
                         hover:bg-emerald-500/25 transition-colors"
            >
              {recorderState === 'playing' ? (
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
              ) : (
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-[1.5px]" fill="currentColor" />
              )}
            </button>

            {/* Progress bar */}
            <div
              className="relative w-20 sm:w-24 h-1.5 rounded-full bg-[hsl(var(--border))] cursor-pointer
                         overflow-hidden"
              onClick={handleProgressClick}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--primary))]"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Time */}
            <span className="text-[0.65rem] sm:text-xs text-[hsl(var(--muted-foreground))] tabular-nums min-w-[3.5rem] ml-1">
              {recorderState === 'playing'
                ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                : formatTime(duration)}
            </span>

            {/* Re-record */}
            <button
              onClick={handleReRecord}
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md ml-1
                         text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]
                         hover:bg-[hsl(var(--border))] transition-colors"
              title="Re-record"
            >
              <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteClick}
              className={`flex items-center justify-center rounded-md transition-colors
                         ${
                           confirmDelete
                             ? 'px-2 h-6 sm:h-7 bg-red-500/15 text-red-500 text-[0.65rem] font-medium'
                             : 'w-6 h-6 sm:w-7 sm:h-7 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10'
                         }`}
              title="Delete audio"
            >
              {confirmDelete ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  Sure?
                </motion.span>
              ) : (
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
