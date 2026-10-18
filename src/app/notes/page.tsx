'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  Download,
  BookOpen,
  Calendar,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  FileCode,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  SortAsc,
} from 'lucide-react';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useNotesStore } from '@/store/notes-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { UploadNotesModal } from '@/components/notes/upload-notes-modal';
import { DocumentViewer } from '@/components/notes/document-viewer';
import type { NoteDocument } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function NotesPage() {
  const isHydrated = useHydration();
  const { activeYearId, activeYear } = useAcademicYearStore();
  const { subjects, fetchSubjects } = useSubjectsStore();
  const { notes, isLoading, fetchNotes, deleteNote, updateNote } = useNotesStore();

  // Selected subject filter: 'all' or subjectId
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image'>('all');

  // Modals & Viewer
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [viewerNote, setViewerNote] = useState<NoteDocument | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<NoteDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Edit title / subtitle modal
  const [editTarget, setEditTarget] = useState<NoteDocument | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSubtitle, setEditSubtitle] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Load notes on mount and on academic year switch
  useEffect(() => {
    if (activeYearId) {
      fetchNotes(activeYearId);
      fetchSubjects(activeYearId);
    }
  }, [activeYearId, fetchNotes, fetchSubjects]);

  // Keep active subject valid if year changes
  useEffect(() => {
    if (selectedSubjectId !== 'all') {
      const exists = subjects.some((s) => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId('all');
      }
    }
  }, [subjects, selectedSubjectId]);

  // Map subjects for easy lookup
  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string; icon: string }>();
    for (const s of subjects) {
      map.set(s.id, { name: s.name, color: s.color, icon: s.icon });
    }
    return map;
  }, [subjects]);

  // Count notes per subject
  const noteCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      counts[n.subject_id] = (counts[n.subject_id] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Filtered & sorted notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Subject filter
        if (selectedSubjectId !== 'all' && n.subject_id !== selectedSubjectId) {
          return false;
        }
        // File type filter
        if (typeFilter === 'pdf' && n.file_type !== 'pdf') return false;
        if (typeFilter === 'image' && n.file_type === 'pdf') return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchSubtitle = n.subtitle?.toLowerCase().includes(q);
          const matchFilename = n.file_name?.toLowerCase().includes(q);
          const subName = subjectMap.get(n.subject_id)?.name.toLowerCase() || '';
          const matchSubject = subName.includes(q);
          return matchTitle || matchSubtitle || matchFilename || matchSubject;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'title-asc') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'title-desc') {
          return b.title.localeCompare(a.title);
        }
        return 0;
      });
  }, [notes, selectedSubjectId, typeFilter, searchQuery, sortBy, subjectMap]);

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteNote(deleteTarget.id);
      if (viewerNote?.id === deleteTarget.id) {
        setViewerNote(null);
      }
      setDeleteTarget(null);
    } catch (e) {
      alert('Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Edit Title / Subtitle
  const handleOpenEdit = (note: NoteDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(note);
    setEditTitle(note.title);
    setEditSubtitle(note.subtitle || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editTitle.trim()) return;
    setIsUpdating(true);
    try {
      const updated = await updateNote(editTarget.id, {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || undefined,
      });
      if (viewerNote?.id === editTarget.id) {
        setViewerNote(updated);
      }
      setEditTarget(null);
    } catch (err) {
      alert('Failed to save document details.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ================= PAGE HEADER ================= */}
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
              <FileText className="w-6 h-6" />
            </span>
            <span>Study Notes & Annotations</span>
          </span>
        }
        description={`Subject-wise digital notebook with full drawing, highlighting, and revision tools for ${activeYear?.name || 'Selected Year'}.`}
      >
        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Notes</span>
        </button>
      </PageHeader>

      {/* ================= SUBJECT SELECTOR CARDS / TABS ================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Select Subject</span>
          </h2>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {notes.length} {notes.length === 1 ? 'document' : 'documents'} total
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 text-center">
            <FolderOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
            <h3 className="text-sm font-semibold mb-1">No subjects found for {activeYear?.name}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
              Please create subjects under the Subjects tab for this academic year to start organizing notes.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* 'All Subjects' Chip */}
            <button
              onClick={() => setSelectedSubjectId('all')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                selectedSubjectId === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Subjects</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  selectedSubjectId === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                {notes.length}
              </span>
            </button>

            {/* Individual Subjects */}
            {subjects.map((sub) => {
              const count = noteCountBySubject[sub.id] || 0;
              const isSelected = selectedSubjectId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-700 shadow-md dark:bg-white dark:text-slate-900 dark:border-white'
                      : 'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color || '#6366f1' }}
                  />
                  <span>{sub.name}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                      isSelected
                        ? 'bg-white/20 dark:bg-black/20 text-inherit'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= SEARCH & SORT TOOLBAR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, subtitle, or subject..."
            className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl pl-9.5 pr-4 py-2 text-xs sm:text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          />
        </div>

        {/* Filter by format & Sort */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Format filter */}
          <div className="flex items-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-1 rounded-xl text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('pdf')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'pdf'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              PDFs
            </button>
            <button
              onClick={() => setTypeFilter('image')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-colors',
                typeFilter === 'image'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              Images
            </button>
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title (A - Z)</option>
            <option value="title-desc">Title (Z - A)</option>
          </select>
        </div>
      </div>

      {/* ================= NOTES GRID / LIST ================= */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-xs font-medium">Loading study notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            searchQuery
              ? 'No matching notes found'
              : selectedSubjectId !== 'all'
              ? `No notes in this subject yet`
              : 'No study notes uploaded'
          }
          description={
            searchQuery
              ? 'Try adjusting your search terms or filters.'
              : 'Upload your lecture notes, textbook chapters, diagrams, or flowcharts to start reading and annotating.'
          }
          actionLabel="Upload First Note"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredNotes.map((note) => {
              const sub = subjectMap.get(note.subject_id);
              const isPdf = note.file_type === 'pdf';
              const formattedDate = format(new Date(note.created_at), 'MMM d, yyyy');
              const formattedSize =
                note.file_size > 1024 * 1024
                  ? `${(note.file_size / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.round(note.file_size / 1024)} KB`;

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -3 }}
                  onClick={() => setViewerNote(note)}
                  className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-indigo-500/40 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Bar: Subject Badge & Format Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {/* Subject Pill */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border max-w-[180px] truncate"
                        style={{
                          backgroundColor: `${sub?.color || '#6366f1'}15`,
                          borderColor: `${sub?.color || '#6366f1'}35`,
                          color: sub?.color || '#6366f1',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub?.color || '#6366f1' }}
                        />
                        <span className="truncate">{sub?.name || 'Subject'}</span>
                      </span>

                      {/* File format badge */}
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider',
                          isPdf
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        )}
                      >
                        {isPdf ? 'PDF' : note.file_type}
                      </span>
                    </div>

                    {/* Document Title & Subtitle */}
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                        {note.title}
                      </h3>
                      {note.subtitle ? (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                          {note.subtitle}
                        </p>
                      ) : (
                        <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] truncate">
                          {note.file_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Metadata & Action Buttons */}
                  <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <HardDrive className="w-3.5 h-3.5" />
                        {formattedSize}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Rename / Edit Title & Subtitle */}
                      <button
                        onClick={(e) => handleOpenEdit(note, e)}
                        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-indigo-600 hover:bg-[hsl(var(--muted))] transition-colors"
                        title="Edit Title & Subtitle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Download Original File */}
                      <a
                        href={`/api/notes/${note.id}/file?download=true`}
                        download={note.file_name}
                        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-indigo-600 hover:bg-[hsl(var(--muted))] transition-colors"
                        title="Download Original File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(note);
                        }}
                        className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ================= UPLOAD MODAL ================= */}
      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultSubjectId={selectedSubjectId !== 'all' ? selectedSubjectId : undefined}
      />

      {/* ================= FULLSCREEN DOCUMENT VIEWER ================= */}
      {viewerNote && (
        <DocumentViewer
          note={viewerNote}
          onClose={() => setViewerNote(null)}
          onUpdate={(updated) => {
            setViewerNote(updated);
          }}
        />
      )}

      {/* ================= EDIT TITLE & SUBTITLE MODAL ================= */}
      <AnimatePresence>
        {editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-bold mb-4">Edit Note Details</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1.5">
                    Note Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-xl px-3.5 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[hsl(var(--foreground))] mb-1.5">
                    Subtitle / Topic Description
                  </label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    placeholder="e.g. Chapter 4 Clinical Notes & Flowcharts"
                    className="w-full bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-xl px-3.5 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !editTitle.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Delete Study Note?</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[hsl(var(--foreground))]">&quot;{deleteTarget.title}&quot;</span>? This will permanently delete the file and all associated annotations. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
