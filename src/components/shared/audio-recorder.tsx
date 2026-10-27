'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Trash2,
  Loader2,
  Play,
  Headphones,
  ChevronDown,
  X,
  Volume2,
} from 'lucide-react';
import { useAudioStore } from '@/store/audio-store';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';

export interface AudioRecorderProps {
  topicId: string;
  topicName: string;
  compact?: boolean;
  onPlayGlobal?: (audioId?: string) => void;
  showList?: boolean;
  onToggleList?: (next?: boolean) => void;
  hideList?: boolean;
}

const MAX_DURATION = 300; // 5 minutes in seconds
const CHECKPOINT_INTERVAL = 20; // seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AudioNotesList: Dedicated full-width tray for 1 or multiple audio notes
// ─────────────────────────────────────────────────────────────────────────────
export function AudioNotesList({
  topicId,
  topicName,
  onPlayGlobal,
  onClose,
}: {
  topicId: string;
  topicName?: string;
  onPlayGlobal?: (audioId?: string) => void;
  onClose?: () => void;
}) {
  const { audioNotes, deleteAudioNote } = useAudioStore();
  const notes = audioNotes[topicId] || [];
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const totalDuration = useMemo(() => {
    return notes.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  }, [notes]);

  if (notes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -4 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mt-3 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 dark:bg-white/[0.02] p-3 sm:p-4 shadow-sm"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[hsl(var(--border))]/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Audio Notes</span>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            {notes.length} {notes.length === 1 ? 'part' : 'parts'}
          </span>
          {totalDuration > 0 && (
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium hidden sm:inline">
              • {formatTotalDuration(totalDuration)} total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onPlayGlobal && notes.length > 1 && (
            <button
              type="button"
              onClick={() => onPlayGlobal()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-xs font-semibold shadow-sm cursor-pointer"
              title="Play all parts in sequence"
            >
              <Play className="w-3 h-3" fill="currentColor" />
              <span>Play All</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              title="Hide audio notes"
              aria-label="Hide audio notes"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Audio Notes: Single Note Layout ────────────────── */}
      {notes.length === 1 ? (
        <div className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:border-indigo-500/30 transition-all">
          <div className="flex items-center gap-3.5 min-w-0">
            {onPlayGlobal && (
              <button
                type="button"
                onClick={() => onPlayGlobal(notes[0].id)}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-500/25 shrink-0 cursor-pointer"
                title="Play audio note"
              >
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              </button>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[hsl(var(--foreground))]">Part 1</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]/70 shadow-xs">
                  {formatTime(notes[0].duration_seconds)}
                </span>
              </div>
              <span className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mt-0.5">
                <Volume2 className="w-3 h-3 text-indigo-500" />
                <span>Recorded audio note</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setConfirmState({
                  title: 'Delete Audio Note',
                  message: 'Are you sure you want to delete this audio note?',
                  onConfirm: () => deleteAudioNote(topicId, notes[0].id),
                });
              }}
              className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Delete audio note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Audio Notes: Multiple Notes Layout ───────────── */
        <div className="space-y-2">
          {notes.map((note, idx) => (
            <div
              key={note.id}
              className="group/note flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-indigo-500/30 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {onPlayGlobal && (
                  <button
                    type="button"
                    onClick={() => onPlayGlobal(note.id)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/note:bg-indigo-600 group-hover/note:text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
                    title={`Play Part ${idx + 1}`}
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                  </button>
                )}

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[hsl(var(--foreground))]">Part {idx + 1}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]/70 shadow-xs">
                      {formatTime(note.duration_seconds)}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    Audio segment #{idx + 1}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmState({
                      title: 'Delete Audio Note',
                      message: `Are you sure you want to delete Part ${idx + 1}?`,
                      onConfirm: () => deleteAudioNote(topicId, note.id),
                    });
                  }}
                  className="p-1.5 sm:p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title={`Delete Part ${idx + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm || (() => {})}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmText="Delete"
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AudioRecorder: Controls (Record, Live Status, Play All, Toggle Pill)
// ─────────────────────────────────────────────────────────────────────────────
export function AudioRecorder({
  topicId,
  topicName,
  compact = true,
  onPlayGlobal,
  showList: controlledShowList,
  onToggleList,
  hideList = false,
}: AudioRecorderProps) {
  const { audioNotes, loadingTopics, createAudioNote, appendAudioChunk, addFinalizedAudioNote } = useAudioStore();

  const notes = audioNotes[topicId] || [];
  const hasAudio = notes.length > 0;
  const isLoading = loadingTopics.includes(topicId);

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [internalShowList, setInternalShowList] = useState(!compact);
  const [checkpointCount, setCheckpointCount] = useState(0);

  const isListOpen = controlledShowList !== undefined ? controlledShowList : internalShowList;

  const toggleList = (next?: boolean) => {
    if (onToggleList) {
      onToggleList(next);
    } else {
      setInternalShowList(typeof next === 'boolean' ? next : !internalShowList);
    }
  };

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkpointTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartRef = useRef<number>(0);
  const lastCheckpointRef = useRef<number>(0);
  const activeNoteIdRef = useRef<string | null>(null);
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
    if (!activeNoteIdRef.current) return;
    if (chunksRef.current.length === 0) return;

    isSavingRef.current = true;
    const chunksCopy = [...chunksRef.current];
    chunksRef.current = [];

    const now = Date.now();
    const chunkDuration = (now - lastCheckpointRef.current) / 1000;
    lastCheckpointRef.current = now;

    try {
      const blob = new Blob(chunksCopy, { type: mimeTypeRef.current });
      await appendAudioChunk(topicId, activeNoteIdRef.current, blob, chunkDuration);
      setCheckpointCount((c) => c + 1);
    } catch (err) {
      console.error('Checkpoint save failed', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [topicId, appendAudioChunk]);

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

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Flush remaining chunks
    if (activeNoteIdRef.current) {
      const remainingChunks = [...chunksRef.current];
      chunksRef.current = [];
      const chunkDuration = (Date.now() - lastCheckpointRef.current) / 1000;

      try {
        const blob = new Blob(remainingChunks, { type: mimeTypeRef.current });
        const finalNote = await appendAudioChunk(topicId, activeNoteIdRef.current, blob, chunkDuration);
        if (finalNote) {
          addFinalizedAudioNote(topicId, finalNote);
        }
      } catch (err) {
        console.error('Final chunk save failed', err);
      }
    }

    activeNoteIdRef.current = null;
    setIsRecording(false);
    setCheckpointCount(0);
    toggleList(true); // Open the list automatically so the user sees their new recording

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Audio note saved', type: 'success' },
        })
      );
    }
  }, [topicId, appendAudioChunk, addFinalizedAudioNote]);

  // ── Start Recording ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      mimeTypeRef.current = mimeType;

      const noteId = await createAudioNote(topicId, mimeType);
      activeNoteIdRef.current = noteId;

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

      timerRef.current = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
        setElapsed(currentElapsed);
      }, 250);

      checkpointTimerRef.current = setInterval(() => {
        flushChunks();
      }, CHECKPOINT_INTERVAL * 1000);

      autoStopTimerRef.current = setTimeout(() => {
        stopAndSave();
      }, MAX_DURATION * 1000);
    } catch (err) {
      console.error('Microphone access denied', err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Microphone access denied', type: 'error' } })
        );
      }
    }
  }, [topicId, createAudioNote, flushChunks, stopAndSave]);

  const progressPercent = (elapsed / MAX_DURATION) * 100;

  return (
    <div className="flex flex-col gap-2 w-fit max-w-full">
      {/* ── Action Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap w-fit max-w-full">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span className="text-[11px] font-medium">Saving…</span>
            </motion.div>
          )}

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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 border border-indigo-500/20 transition-colors duration-150 text-xs font-semibold shrink-0 cursor-pointer"
              title={`Record audio for ${topicName}`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record</span>
            </motion.button>
          )}

          {/* ── Recording State ────────────────────────────── */}
          {!isLoading && isRecording && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0"
            >
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Mic className="w-3.5 h-3.5 text-red-500" />
              </motion.div>

              <span className="text-xs font-medium text-red-500 tabular-nums">
                {formatTime(elapsed)} / {formatTime(MAX_DURATION)}
              </span>

              <div className="w-12 h-1.5 rounded-full bg-red-500/20 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {checkpointCount > 0 && (
                <span
                  className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded"
                  title={`${checkpointCount} checkpoint(s) saved`}
                >
                  ✓{checkpointCount}
                </span>
              )}

              <button
                type="button"
                onClick={stopAndSave}
                className="flex items-center justify-center w-6 h-6 rounded-md ml-1 bg-red-500 text-white hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                title="End recording & save"
              >
                <Square className="w-3 h-3" fill="currentColor" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Play Button if has audio */}
        {hasAudio && !isRecording && (
          <motion.div className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {onPlayGlobal && (
              <button
                type="button"
                onClick={() => onPlayGlobal()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors text-xs font-semibold cursor-pointer shrink-0"
                title="Play all audio notes for this topic"
              >
                <Play className="w-3 h-3" fill="currentColor" />
                <span>Play All</span>
              </button>
            )}

            {/* Audio Notes Toggle Button */}
            <button
              type="button"
              onClick={() => toggleList()}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer',
                isListOpen
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:border-indigo-500/30'
              )}
              title={isListOpen ? 'Hide audio notes' : `Show ${notes.length} audio note${notes.length === 1 ? '' : 's'}`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{isListOpen ? 'Hide Audio' : `Audio (${notes.length})`}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', isListOpen && 'rotate-180')} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Standalone fallback list (only when hideList is false) */}
      {!hideList && (
        <AnimatePresence>
          {hasAudio && isListOpen && (
            <AudioNotesList
              topicId={topicId}
              topicName={topicName}
              onPlayGlobal={onPlayGlobal}
              onClose={() => toggleList(false)}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
