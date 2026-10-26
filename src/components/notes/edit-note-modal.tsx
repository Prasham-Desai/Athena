'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X, Loader2, BookOpen, Tag } from 'lucide-react';
import type { NoteDocument, Subject } from '@/types';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteDocument | null;
  subjects: Subject[];
  onSave: (
    noteId: string,
    data: {
      title: string;
      subtitle?: string;
      chapter_id?: string | null;
      topic_id?: string | null;
    }
  ) => Promise<void>;
}

export function EditNoteModal({
  isOpen,
  onClose,
  note,
  subjects,
  onSave,
}: EditNoteModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.title);
      setSubtitle(note.subtitle || '');
      setChapterId(note.chapter_id || '');
      setTopicId(note.topic_id || '');
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  const currentSubject = subjects.find((s) => s.id === note.subject_id);
  const chapters = currentSubject?.chapters || [];
  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const topics = selectedChapter?.topics || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(note.id, {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        chapter_id: chapterId || null,
        topic_id: topicId || null,
      });
      onClose();
    } catch (err) {
      alert('Failed to save document details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                Edit Note Details
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Update document title, description, and linked curriculum.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Histology Lecture Notes"
                className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                Subtitle / Description
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Microscopic diagrams and key takeaways"
                className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              />
            </div>

            {/* Curriculum Linking Section */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Curriculum Association</span>
                </span>
                {currentSubject && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${currentSubject.color || '#6366f1'}15`,
                      borderColor: `${currentSubject.color || '#6366f1'}30`,
                      color: currentSubject.color || '#6366f1',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: currentSubject.color || '#6366f1' }}
                    />
                    <span>{currentSubject.name}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Chapter Select */}
                <div>
                  <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] block mb-1">
                    Chapter
                  </label>
                  <select
                    value={chapterId}
                    onChange={(e) => {
                      setChapterId(e.target.value);
                      setTopicId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
                  >
                    <option value="">None / Entire Subject</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Select */}
                <div>
                  <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] block mb-1">
                    Topic
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    disabled={!chapterId || topics.length === 0}
                    className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">
                      {!chapterId
                        ? 'Select chapter first'
                        : topics.length === 0
                        ? 'No topics in chapter'
                        : 'None / General Chapter Note'}
                    </option>
                    {topics.map((top) => (
                      <option key={top.id} value={top.id}>
                        {top.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
