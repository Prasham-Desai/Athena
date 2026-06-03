'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, RefreshCcw, Trash2, Loader2 } from 'lucide-react';
import { useStoriesStore } from '@/store/stories-store';

interface StoryAudioRecorderProps {
  storyId: string;
  compact?: boolean;
  onSuccess?: () => void;
}

type RecorderState = 'idle' | 'recording' | 'pending-save';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StoryAudioRecorder({ storyId, compact = true, onSuccess }: StoryAudioRecorderProps) {
  const { loadingStoryIds, saveStoryAudio } = useStoriesStore();

  const isLoading = loadingStoryIds.includes(storyId);

  // State
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartRef = useRef<number>(0);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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



  // ── Save / Discard Pending ─────────────────────────────────
  const handleSavePending = useCallback(async () => {
    if (!pendingBlob) return;
    try {
      await saveStoryAudio(storyId, pendingBlob, pendingDuration);
      setRecorderState('idle');
      if (onSuccess) onSuccess();
    } catch {
      // Revert if failed
      setRecorderState('idle');
    } finally {
      setPendingBlob(null);
    }
  }, [pendingBlob, pendingDuration, saveStoryAudio, storyId, onSuccess]);

  const handleDiscardPending = useCallback(() => {
    setPendingBlob(null);
    setRecorderState('idle');
  }, []);



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
            title="Record Story Audio"
          >
            <Mic className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Record Audio
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


      </AnimatePresence>
    </div>
  );
}
