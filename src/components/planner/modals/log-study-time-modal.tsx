'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Clock, Plus, Sparkles } from 'lucide-react';
import { getToday } from '@/lib/utils';
import { formatDurationHuman } from '@/lib/study-analytics';
import type { Task, StudySession } from '@/types';

interface LogStudyTimeModalProps {
  open: boolean;
  initialDate?: string;
  subjects?: { id: string; name: string; color: string }[];
  tasks?: Task[];
  sessions?: StudySession[];
  onClose: () => void;
  onAddHours?: (data: { durationMinutes: number; date: string; notes?: string }) => Promise<void>;
  onAddStudyLog?: (log: any) => Promise<void>;
}

const PRESET_ADDITIONS = [
  { label: '+30m', mins: 30 },
  { label: '+1h', mins: 60 },
  { label: '+1.5h', mins: 90 },
  { label: '+2h', mins: 120 },
  { label: '+3h', mins: 180 },
  { label: '+4h', mins: 240 },
];

export function LogStudyTimeModal({
  open,
  initialDate,
  subjects = [],
  onClose,
  onAddHours,
  onAddStudyLog,
}: LogStudyTimeModalProps) {
  const defaultDate = initialDate || getToday();

  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalMinutes = Math.max(0, (Number(hours) || 0) * 60 + (Number(minutes) || 0));

  const handleApplyPreset = (addMins: number) => {
    const current = totalMinutes;
    const nextTotal = current + addMins;
    setHours(Math.floor(nextTotal / 60));
    setMinutes(nextTotal % 60);
    setErrorMsg('');
  };

  const handleSetExact = (targetMins: number) => {
    setHours(Math.floor(targetMins / 60));
    setMinutes(targetMins % 60);
    setErrorMsg('');
  };

  const resetForm = () => {
    setHours(1);
    setMinutes(0);
    setDate(defaultDate);
    setNotes('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalMinutes <= 0) {
      setErrorMsg('Please specify at least 1 minute of study time');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (onAddHours) {
        await onAddHours({
          durationMinutes: totalMinutes,
          date,
          notes: notes.trim(),
        });
      } else if (onAddStudyLog) {
        const now = new Date();
        const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const startMs = now.getTime() - totalMinutes * 60000;
        const startDate = new Date(startMs);
        const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

        await onAddStudyLog({
          title: notes.trim() || 'Manual Study Time',
          date,
          subjectId: subjects[0]?.id || 'general',
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes: totalMinutes,
          priority: 'medium',
          completed: true,
          notes: notes.trim(),
        });
      }

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `Added ${formatDurationHuman(totalMinutes)} to study time!`,
            type: 'success',
          },
        })
      );

      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save study time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-md flex flex-col max-h-[90vh] rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden min-w-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4 shrink-0 bg-[hsl(var(--card))]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))] truncate">Log Study Time</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                  Add offline study hours directly to your timer
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form id="log-custom-study-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-w-0">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Hours and Minutes Inputs */}
            <div>
              <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider block mb-2">
                Study Duration
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Hours */}
                <div className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
                    Hours
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      max="24"
                      value={hours === 0 && minutes > 0 ? '' : hours}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setHours(isNaN(val) ? 0 : Math.max(0, Math.min(24, val)));
                        setErrorMsg('');
                      }}
                      className="w-full text-2xl font-black text-[hsl(var(--foreground))] bg-transparent focus:outline-none tabular-nums"
                    />
                    <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">hrs</span>
                  </div>
                </div>

                {/* Minutes */}
                <div className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
                    Minutes
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={minutes === 0 && hours > 0 ? '' : minutes}
                      placeholder="0"
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setMinutes(isNaN(val) ? 0 : Math.max(0, Math.min(59, val)));
                        setErrorMsg('');
                      }}
                      className="w-full text-2xl font-black text-[hsl(var(--foreground))] bg-transparent focus:outline-none tabular-nums"
                    />
                    <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">mins</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">Quick Add</span>
                  {totalMinutes > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setHours(0);
                        setMinutes(0);
                      }}
                      className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-red-400 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ADDITIONS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyPreset(preset.mins)}
                      className="px-2.5 py-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-emerald-500/40 hover:bg-emerald-500/10 text-xs font-semibold text-[hsl(var(--foreground))] transition active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Added Time Display */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Adding: <span className="text-emerald-500 font-bold">{formatDurationHuman(totalMinutes)}</span>
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500/80">
                +{totalMinutes} mins
              </span>
            </div>

            {/* Study Date */}
            <div>
              <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider block mb-1.5">
                Study Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/60"
              />
            </div>

            {/* Optional Note */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">
                  Note / Topic
                </label>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">optional</span>
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Offline textbook reading, lecture revision…"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/60"
              />
            </div>

            <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
              No subjects or start/end clock times needed. This directly adds study hours to your daily timer and focus record.
            </p>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[hsl(var(--border))] px-5 py-4 shrink-0 bg-[hsl(var(--card))]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="log-custom-study-form"
              disabled={isSubmitting || totalMinutes <= 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isSubmitting ? 'Saving…' : 'Add Study Time'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
