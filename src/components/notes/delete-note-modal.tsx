'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { NoteDocument } from '@/types';

interface DeleteNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteDocument | null;
  onConfirm: (noteId: string) => Promise<void>;
}

export function DeleteNoteModal({
  isOpen,
  onClose,
  note,
  onConfirm,
}: DeleteNoteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !note) return null;

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm(note.id);
      onClose();
    } catch (err) {
      alert('Failed to delete note.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-2xl"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-2">
            Delete Study Note?
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-[hsl(var(--foreground))]">
              &quot;{note.title}&quot;
            </span>
            ? This action cannot be undone, and all associated canvas annotations and highlights will be permanently removed.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-rose-500/20 transition"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Delete Permanently</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
