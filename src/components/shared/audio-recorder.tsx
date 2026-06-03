'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Trash2, Loader2, Play } from 'lucide-react';
import { useAudioStore } from '@/store/audio-store';
import { ConfirmModal } from '@/components/shared/confirm-modal';

interface AudioRecorderProps {
  topicId: string;
  topicName: string;
  compact?: boolean;
  onPlayGlobal?: (audioId?: string) => void;
}

type RecorderState = 'idle' | 'recording' | 'pending-save';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioRecorder({ topicId, topicName, compact = true, onPlayGlobal }: AudioRecorderProps) {
  const { audioNotes, loadingTopics, saveAudioNote, deleteAudioNote } = useAudioStore();

  const notes = audioNotes[topicId] || [];
  const hasAudio = notes.length > 0;
  const isLoading = loadingTopics.includes(topicId);

  // State
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [showList, setShowList] = useState(!compact);
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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

        setPendingBlob(blob);
        setPendingDuration(exactDuration);
        setRecorderState('pending-save');
      };

      mediaRecorder.start(250); 
      setElapsed(0);
      setRecorderState('recording');

      recordingStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 250);
    } catch (err) {
      console.error('Microphone access denied', err);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Microphone access denied', type: 'error' } })
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
      await saveAudioNote(topicId, pendingBlob, pendingDuration);
      setRecorderState('idle');
      setShowList(true); // show list after saving new audio
    } catch {
      setRecorderState('idle');
    } finally {
      setPendingBlob(null);
    }
  }, [pendingBlob, pendingDuration, saveAudioNote, topicId]);

  const handleDiscardPending = useCallback(() => {
    setPendingBlob(null);
    setRecorderState('idle');
  }, []);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-2 ${compact ? 'mt-1' : 'mt-2'} w-full`}>
      {/* ── Action Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap w-full">
        <AnimatePresence mode="wait">
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
              <Mic className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-semibold">Record</span>
            </motion.button>
          )}

          {/* ── Recording State ────────────────────────────── */}
          {!isLoading && recorderState === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Mic className="w-3.5 h-3.5 text-red-500" />
              </motion.div>
              <span className="text-xs font-medium text-red-500 tabular-nums min-w-[2.5rem] ml-1">
                {formatTime(elapsed)}
              </span>
              <button
                onClick={stopRecording}
                className="flex items-center justify-center w-6 h-6 rounded-md ml-1 bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                <Square className="w-3 h-3" fill="currentColor" />
              </button>
            </motion.div>
          )}

          {/* ── Pending Save ──────────────────────────────── */}
          {!isLoading && recorderState === 'pending-save' && (
            <motion.div
              key="pending-save"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Review: {formatTime(pendingDuration)}
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={handleDiscardPending}
                  className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSavePending}
                  className="px-3 py-1 text-[10px] font-medium rounded-md shadow-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Play Button if has audio */}
        {hasAudio && recorderState === 'idle' && (
          <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => onPlayGlobal && onPlayGlobal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors text-xs font-semibold"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" /> Play All
            </button>

            <button
              onClick={() => setShowList(!showList)}
              className="text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              {showList ? 'Hide Audio List' : `Show Audio (${notes.length})`}
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Audio List ──────────────────────────────────────── */}
      <AnimatePresence>
        {hasAudio && showList && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden w-full"
          >
            <div className="flex flex-col gap-2 mt-3">
              {notes.map((note, idx) => (
                <div key={note.id} className="group/note flex items-center justify-between p-3 rounded-2xl bg-[hsl(var(--muted))/30] hover:bg-[hsl(var(--muted))/60] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))/30] transition-all duration-200 shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {onPlayGlobal && (
                      <button
                        onClick={() => onPlayGlobal(note.id)}
                        className="w-9 h-9 shrink-0 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] flex items-center justify-center group-hover/note:bg-indigo-500 group-hover/note:border-indigo-500 group-hover/note:text-white transition-all shadow-sm"
                        title="Play from this part"
                      >
                        <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                      </button>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Part {idx + 1}</span>
                      <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Audio Note</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] tabular-nums bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-1 rounded-lg shadow-sm">
                      {formatTime(note.duration_seconds)}
                    </span>
                    <button
                      onClick={() => {
                        setConfirmState({
                          title: 'Delete Audio Note',
                          message: 'Are you sure you want to delete this audio note?',
                          onConfirm: () => deleteAudioNote(topicId, note.id)
                        });
                      }}
                      className="text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-0 group-hover/note:opacity-100 focus:opacity-100"
                      title="Delete segment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
