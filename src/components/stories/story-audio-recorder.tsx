'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useStoriesStore } from '@/store/stories-store';

interface StoryAudioRecorderProps {
  storyId: string;
  compact?: boolean;
  onSuccess?: () => void;
}

const MAX_DURATION = 600; // 10 minutes in seconds
const CHECKPOINT_INTERVAL = 20; // seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StoryAudioRecorder({ storyId, compact = true, onSuccess }: StoryAudioRecorderProps) {
  const { loadingStoryIds, createStoryAudioNote, appendStoryAudioChunk } = useStoriesStore();

  const isLoading = loadingStoryIds.includes(storyId);

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [checkpointCount, setCheckpointCount] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkpointTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartRef = useRef<number>(0);
  const lastCheckpointRef = useRef<number>(0);
  const activeAudioIdRef = useRef<string | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm;codecs=opus');
  const isSavingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (checkpointTimerRef.current) clearInterval(checkpointTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── Flush accumulated chunks as a checkpoint ──────────────
  const flushChunks = useCallback(async () => {
    if (isSavingRef.current) return;
    if (!activeAudioIdRef.current) return;
    if (chunksRef.current.length === 0) return;

    isSavingRef.current = true;
    const chunksCopy = [...chunksRef.current];
    chunksRef.current = [];

    const now = Date.now();
    const chunkDuration = (now - lastCheckpointRef.current) / 1000;
    lastCheckpointRef.current = now;

    try {
      const blob = new Blob(chunksCopy, { type: mimeTypeRef.current });
      await appendStoryAudioChunk(storyId, activeAudioIdRef.current, blob, chunkDuration);
      setCheckpointCount((c) => c + 1);
    } catch (err) {
      console.error('Checkpoint save failed', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [storyId, appendStoryAudioChunk]);

  // ── Stop + final save ─────────────────────────────────────
  const stopAndSave = useCallback(async () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (checkpointTimerRef.current) {
      clearInterval(checkpointTimerRef.current);
      checkpointTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    // Stop the MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Wait a tick for final ondataavailable to fire
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Flush remaining chunks
    if (chunksRef.current.length > 0 && activeAudioIdRef.current) {
      const remainingChunks = [...chunksRef.current];
      chunksRef.current = [];

      const chunkDuration = (Date.now() - lastCheckpointRef.current) / 1000;

      try {
        const blob = new Blob(remainingChunks, { type: mimeTypeRef.current });
        await appendStoryAudioChunk(storyId, activeAudioIdRef.current, blob, chunkDuration);
      } catch (err) {
        console.error('Final chunk save failed', err);
      }
    }

    activeAudioIdRef.current = null;
    setIsRecording(false);
    setCheckpointCount(0);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Story audio saved', type: 'success' },
        })
      );
    }

    if (onSuccess) onSuccess();
  }, [storyId, appendStoryAudioChunk, onSuccess]);

  // ── Start Recording ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      mimeTypeRef.current = mimeType;

      // Reserve a DB row immediately
      const audioId = await createStoryAudioNote(storyId, mimeType);
      activeAudioIdRef.current = audioId;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {};

      mediaRecorder.start(250);
      setElapsed(0);
      setCheckpointCount(0);
      setIsRecording(true);

      recordingStartRef.current = Date.now();
      lastCheckpointRef.current = Date.now();

      // Elapsed timer (UI update)
      timerRef.current = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
        setElapsed(currentElapsed);
      }, 250);

      // 20-second checkpoint timer
      checkpointTimerRef.current = setInterval(() => {
        flushChunks();
      }, CHECKPOINT_INTERVAL * 1000);

      // 5-minute auto-stop
      autoStopTimerRef.current = setTimeout(() => {
        stopAndSave();
      }, MAX_DURATION * 1000);
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
  }, [storyId, createStoryAudioNote, flushChunks, stopAndSave]);

  // ── Render ─────────────────────────────────────────────────
  const progressPercent = (elapsed / MAX_DURATION) * 100;

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
        {!isLoading && !isRecording && (
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
            title="Record Story Audio"
          >
            <Mic className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Record Audio
            </span>
          </motion.button>
        )}

        {/* ── Recording ────────────────────────────────────── */}
        {!isLoading && isRecording && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg
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

            {/* Time display: elapsed / max */}
            <span className="text-xs sm:text-sm font-medium text-red-500 tabular-nums min-w-[5rem]">
              {formatTime(elapsed)} / {formatTime(MAX_DURATION)}
            </span>

            {/* Mini progress bar */}
            <div className="w-16 h-1.5 rounded-full bg-red-500/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Checkpoint indicator */}
            {checkpointCount > 0 && (
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded" title={`${checkpointCount} checkpoint(s) saved`}>
                ✓{checkpointCount}
              </span>
            )}

            {/* Stop button */}
            <button
              onClick={stopAndSave}
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md ml-1
                         bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              title="End recording & save"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
