'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, RefreshCcw, Trash2, Loader2 } from 'lucide-react';
import { useAudioStore } from '@/store/audio-store';

interface AudioRecorderProps {
  topicId: string;
  topicName: string;
  compact?: boolean;
}

type RecorderState = 'idle' | 'recording' | 'has-audio' | 'playing';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioRecorder({ topicId, topicName, compact = true }: AudioRecorderProps) {
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

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const recordedDuration = elapsed;

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Save via store
        try {
          await saveAudioNote(topicId, blob, recordedDuration);
          setRecorderState('has-audio');
          setDuration(recordedDuration);
        } catch {
          setRecorderState('idle');
        }
      };

      mediaRecorder.start(250); // collect chunks every 250ms
      setElapsed(0);
      setRecorderState('recording');

      // Elapsed timer
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
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
  }, [topicId, saveAudioNote, elapsed]);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTime(0);
    startRecording();
  }, [startRecording]);

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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={startRecording}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.15] border border-[hsl(var(--primary))/0.2] transition-colors duration-150 w-fit"
            title={`Record audio for ${topicName}`}
          >
            <Mic className="w-3 h-3" />
            <span className="text-[0.65rem] font-medium">
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
            className="flex items-center gap-2 px-2 py-1 rounded-lg
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
            <span className="text-[0.65rem] font-medium text-red-500 tabular-nums min-w-[2rem]">
              {formatTime(elapsed)}
            </span>

            {/* Stop button */}
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-5 h-5 rounded-md
                         bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <Square className="w-2.5 h-2.5" fill="currentColor" />
            </button>
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
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg
                       bg-[hsl(var(--muted))] border border-[hsl(var(--border))]"
          >
            {/* Play/Pause */}
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center w-5 h-5 rounded-md
                         bg-emerald-500/15 text-emerald-600 dark:text-emerald-400
                         hover:bg-emerald-500/25 transition-colors"
            >
              {recorderState === 'playing' ? (
                <Pause className="w-2.5 h-2.5" fill="currentColor" />
              ) : (
                <Play className="w-2.5 h-2.5 ml-[1px]" fill="currentColor" />
              )}
            </button>

            {/* Progress bar */}
            <div
              className="relative w-16 h-1.5 rounded-full bg-[hsl(var(--border))] cursor-pointer
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
            <span className="text-[0.6rem] text-[hsl(var(--muted-foreground))] tabular-nums min-w-[3.25rem]">
              {recorderState === 'playing'
                ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                : formatTime(duration)}
            </span>

            {/* Re-record */}
            <button
              onClick={handleReRecord}
              className="flex items-center justify-center w-4.5 h-4.5 rounded
                         text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]
                         hover:bg-[hsl(var(--border))] transition-colors"
              title="Re-record"
            >
              <RefreshCcw className="w-2.5 h-2.5" />
            </button>

            {/* Delete */}
            <button
              onClick={handleDeleteClick}
              className={`flex items-center justify-center rounded transition-colors
                         ${
                           confirmDelete
                             ? 'px-1.5 h-4.5 bg-red-500/15 text-red-500 text-[0.55rem] font-medium'
                             : 'w-4.5 h-4.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10'
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
                <Trash2 className="w-2.5 h-2.5" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
