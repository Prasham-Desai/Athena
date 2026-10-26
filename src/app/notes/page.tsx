'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit3,
  Download,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FolderOpen,
  Plus,
  CheckCircle2,
  ChevronDown,
  Clock,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useNotesStore } from '@/store/notes-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { UploadNotesModal } from '@/components/notes/upload-notes-modal';
import { DocumentViewer } from '@/components/notes/document-viewer';
import type { NoteDocument, Subject, Chapter, Topic } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CardGridLoader, PageLoader } from '@/components/ui/loading';

export default function NotesPage() {
  const isHydrated = useHydration();
  const { activeYearId, activeYear } = useAcademicYearStore();
  const { subjects, fetchSubjects } = useSubjectsStore();
  const { notes, isLoading, fetchNotes, deleteNote, updateNote } = useNotesStore();

  // Navigation state: null = Subjects List overview, string = Subject Workspace
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Filters within a subject or globally
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');

  // Modals & Document Viewer
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [viewerNote, setViewerNote] = useState<NoteDocument | null>(null);

  // Type-filter dropdown state
  const [typeFilterOpen, setTypeFilterOpen] = useState<boolean>(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  // Close type-filter dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeFilterRef.current && !typeFilterRef.current.contains(e.target as Node)) {
        setTypeFilterOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTypeFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<NoteDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Edit Note Modal
  const [editTarget, setEditTarget] = useState<NoteDocument | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSubtitle, setEditSubtitle] = useState<string>('');
  const [editChapterId, setEditChapterId] = useState<string>('');
  const [editTopicId, setEditTopicId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Load notes and subjects on mount & academic year switch
  useEffect(() => {
    if (activeYearId) {
      setSelectedSubjectId(null);
      setSelectedChapterId('all');
      setSelectedTopicId('all');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('subjectId');
        window.history.replaceState({}, '', url.toString());
      }
      fetchNotes(activeYearId);
      fetchSubjects(activeYearId);
    }
  }, [activeYearId, fetchNotes, fetchSubjects]);

  // Read URL query params on mount to support direct linking (e.g. from chapters page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSubjectId = params.get('subjectId');
      if (urlSubjectId) {
        setSelectedSubjectId(urlSubjectId);
      }
    }
  }, []);

  // If a subject was selected from URL or previous state but is not present in active subjects list, reset back to overview
  useEffect(() => {
    if (selectedSubjectId && subjects.length > 0 && !subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(null);
    }
  }, [selectedSubjectId, subjects]);

  // Sync browser URL when subject changes
  const handleSelectSubject = (subjectId: string | null) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('all');
    setSelectedTopicId('all');
    setSearchQuery('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (subjectId) {
        url.searchParams.set('subjectId', subjectId);
      } else {
        url.searchParams.delete('subjectId');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Selected Subject details
  const activeSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return subjects.find((s) => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  // Lookup maps for fast access to Chapter & Topic names
  const { chapterMap, topicMap } = useMemo(() => {
    const cMap = new Map<string, Chapter>();
    const tMap = new Map<string, Topic>();

    for (const sub of subjects) {
      for (const chap of sub.chapters || []) {
        cMap.set(chap.id, chap);
        for (const top of chap.topics || []) {
          tMap.set(top.id, top);
        }
      }
    }
    return { chapterMap: cMap, topicMap: tMap };
  }, [subjects]);

  // Count notes per subject
  const noteStatsBySubject = useMemo(() => {
    const counts: Record<string, { total: number; pdfs: number; images: number }> = {};
    for (const sub of subjects) {
      counts[sub.id] = { total: 0, pdfs: 0, images: 0 };
    }
    for (const n of notes) {
      if (!counts[n.subject_id]) {
        counts[n.subject_id] = { total: 0, pdfs: 0, images: 0 };
      }
      counts[n.subject_id].total += 1;
      if (n.file_type === 'pdf') {
        counts[n.subject_id].pdfs += 1;
      } else {
        counts[n.subject_id].images += 1;
      }
    }
    return counts;
  }, [subjects, notes]);

  // Count notes per chapter in active subject
  const noteCountByChapter = useMemo(() => {
    if (!activeSubject) return {};
    const counts: Record<string, number> = {};
    const subNotes = notes.filter((n) => n.subject_id === activeSubject.id);
    for (const n of subNotes) {
      if (n.chapter_id) {
        counts[n.chapter_id] = (counts[n.chapter_id] || 0) + 1;
      }
    }
    return counts;
  }, [activeSubject, notes]);

  // Filtered notes for current view
  const displayedNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // If in a subject view, enforce subject
        if (selectedSubjectId && n.subject_id !== selectedSubjectId) {
          return false;
        }

        // Chapter filter (when inside a subject)
        if (selectedSubjectId && selectedChapterId !== 'all') {
          if (n.chapter_id !== selectedChapterId) return false;

          // Topic filter
          if (selectedTopicId !== 'all' && n.topic_id !== selectedTopicId) {
            return false;
          }
        }

        // File format filter
        if (typeFilter === 'pdf' && n.file_type !== 'pdf') return false;
        if (typeFilter === 'image' && n.file_type === 'pdf') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchSubtitle = n.subtitle?.toLowerCase().includes(q);
          const matchFilename = n.file_name?.toLowerCase().includes(q);
          const subName = subjects.find((s) => s.id === n.subject_id)?.name.toLowerCase() || '';
          const matchSubject = subName.includes(q);
          const chapName = n.chapter_id ? chapterMap.get(n.chapter_id)?.name.toLowerCase() || '' : '';
          const matchChapter = chapName.includes(q);
          const topName = n.topic_id ? topicMap.get(n.topic_id)?.name.toLowerCase() || '' : '';
          const matchTopic = topName.includes(q);

          return matchTitle || matchSubtitle || matchFilename || matchSubject || matchChapter || matchTopic;
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
  }, [
    notes,
    selectedSubjectId,
    selectedChapterId,
    selectedTopicId,
    typeFilter,
    searchQuery,
    sortBy,
    subjects,
    chapterMap,
    topicMap,
  ]);

  // Recent notes for Level 1 overview (top 6 most recent)
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [notes]);

  // Handle Note Deletion
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

  // Open Edit Details Modal
  const handleOpenEdit = (note: NoteDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(note);
    setEditTitle(note.title);
    setEditSubtitle(note.subtitle || '');
    setEditChapterId(note.chapter_id || '');
    setEditTopicId(note.topic_id || '');
  };

  // Save Edit Details Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editTitle.trim()) return;
    setIsUpdating(true);
    try {
      const updated = await updateNote(editTarget.id, {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || undefined,
        chapter_id: editChapterId || null,
        topic_id: editTopicId || null,
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
    return <PageLoader label="Loading notes" variant="cards" />;
  }

  // Chapters of current edit target subject
  const editSubject = editTarget ? subjects.find((s) => s.id === editTarget.subject_id) : null;
  const editChapters = editSubject?.chapters || [];
  const editSelectedChapter = editChapters.find((c) => c.id === editChapterId);
  const editTopics = editSelectedChapter?.topics || [];

  return (
    <div className="space-y-6 pb-16">
      {/* =========================================================================
          TOP BREADCRUMBS & CONTEXT BAR
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleSelectSubject(null)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              !selectedSubjectId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))]'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notes Library</span>
          </button>

          {activeSubject && (
            <>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs font-bold text-[hsl(var(--foreground))] shadow-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: activeSubject.color || '#6366f1' }}
                />
                <span>{activeSubject.name}</span>
              </div>
            </>
          )}
        </div>

        {/* Global Upload Button */}
        <div className="flex items-center gap-2">
          {activeSubject && (
            <button
              onClick={() => handleSelectSubject(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))] border border-[hsl(var(--border))] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Subjects</span>
            </button>
          )}

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Notes</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: ALL SUBJECTS OVERVIEW (Flow Step 1: Listing All Subject Tabs/Cards)
          ========================================================================= */}
      {!selectedSubjectId ? (
        <div className="space-y-8">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[hsl(var(--card))] p-6 sm:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeYear?.name || 'Academic Year'} Study Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[hsl(var(--foreground))] tracking-tight">
                Subject Notebooks & Digital Annotations
              </h1>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                Click any subject below to open its dedicated notes workspace. Upload lecture PDFs, textbook chapters, and handwritten diagrams with optional chapter & topic linking.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 pt-6 border-t border-indigo-500/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Total Documents
                </span>
                <p className="text-xl sm:text-2xl font-black text-[hsl(var(--foreground))]">
                  {notes.length}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Subjects
                </span>
                <p className="text-xl sm:text-2xl font-black text-indigo-400">
                  {subjects.length}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  PDF Documents
                </span>
                <p className="text-xl sm:text-2xl font-black text-rose-400">
                  {notes.filter((n) => n.file_type === 'pdf').length}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Diagrams & Images
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">
                  {notes.filter((n) => n.file_type !== 'pdf').length}
                </p>
              </div>
            </div>
          </div>

          {/* Section: All Subjects Cards Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <span>Select a Subject</span>
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Choose a subject to manage, browse, and upload notes for its curriculum.
                </p>
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} total
              </span>
            </div>

            {subjects.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center space-y-3">
                <FolderOpen className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto opacity-60" />
                <h3 className="text-sm font-bold">No subjects found for {activeYear?.name}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                  Subjects must be created in your academic curriculum before uploading subject-specific notes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {subjects.map((sub) => {
                  const stats = noteStatsBySubject[sub.id] || { total: 0, pdfs: 0, images: 0 };
                  const chaptersCount = sub.chapters?.length || 0;

                  return (
                    <motion.div
                      key={sub.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectSubject(sub.id)}
                      className="group relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                    >
                      {/* Top colored highlight line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
                        style={{ backgroundColor: sub.color || '#6366f1' }}
                      />

                      {/* Header row */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4 mt-1">
                          {/* Subject Icon & Tag */}
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: sub.color || '#6366f1' }}
                            >
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <span
                                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border"
                                style={{
                                  backgroundColor: `${sub.color || '#6366f1'}15`,
                                  borderColor: `${sub.color || '#6366f1'}30`,
                                  color: sub.color || '#6366f1',
                                }}
                              >
                                {chaptersCount} Chapters
                              </span>
                              <h3 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {sub.name}
                              </h3>
                            </div>
                          </div>

                          {/* Arrow indicator */}
                          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--muted))] group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-[hsl(var(--muted-foreground))] transition-colors shrink-0">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>

                        {/* Breakdown pills */}
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mt-2">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-rose-400" />
                            <span>{stats.pdfs} PDFs</span>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{stats.images} Images</span>
                          </span>
                        </div>
                      </div>

                      {/* Bottom Footer */}
                      <div className="mt-6 pt-4 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[hsl(var(--muted-foreground))]">
                          {stats.total === 0 ? 'No notes yet' : `${stats.total} total notes`}
                        </span>
                        <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          <span>Open Notes</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section: Global Recent Notes */}
          {recentNotes.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Recent Study Notes Across All Subjects</span>
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Quickly resume reading or annotating your recently uploaded documents.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentNotes.map((note) => {
                  const sub = subjects.find((s) => s.id === note.subject_id);
                  const chap = note.chapter_id ? chapterMap.get(note.chapter_id) : null;
                  const isPdf = note.file_type === 'pdf';

                  return (
                    <div
                      key={note.id}
                      onClick={() => setViewerNote(note)}
                      className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm hover:border-indigo-500/40 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Top subject pill & type */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border truncate max-w-[170px]"
                            style={{
                              backgroundColor: `${sub?.color || '#6366f1'}15`,
                              borderColor: `${sub?.color || '#6366f1'}30`,
                              color: sub?.color || '#6366f1',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: sub?.color || '#6366f1' }}
                            />
                            <span className="truncate">{sub?.name || 'Subject'}</span>
                          </span>

                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider',
                              isPdf
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            )}
                          >
                            {isPdf ? 'PDF' : note.file_type}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                          {note.title}
                        </h4>
                        {note.subtitle && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mb-2">
                            {note.subtitle}
                          </p>
                        )}

                        {chap && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md mb-2">
                            <BookOpen className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[190px]">{chap.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
                        <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                        <span className="text-indigo-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                          <span>Read</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: DEDICATED SUBJECT WORKSPACE (Flow Step 2: Subject is opened)
            ========================================================================= */
        <div className="space-y-6">
          {/* Subject Workspace Hero */}
          {activeSubject && (
            <div
              className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-lg"
              style={{
                borderColor: `${activeSubject.color || '#6366f1'}35`,
                background: `linear-gradient(135deg, ${activeSubject.color || '#6366f1'}15 0%, hsl(var(--card)) 100%)`,
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: activeSubject.color || '#6366f1' }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                    style={{ backgroundColor: activeSubject.color || '#6366f1' }}
                  >
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 dark:bg-black/20 text-[hsl(var(--foreground))]">
                        {activeYear?.name || 'Academic Year'}
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {activeSubject.chapters?.length || 0} chapters
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-[hsl(var(--foreground))]">
                      {activeSubject.name} Notes
                    </h1>
                  </div>
                </div>

                {/* Upload action directly inside this subject */}
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  style={{
                    backgroundColor: activeSubject.color || '#6366f1',
                    boxShadow: `0 10px 25px -5px ${activeSubject.color || '#6366f1'}40`,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Note to {activeSubject.name}</span>
                </button>
              </div>
            </div>
          )}

          {/* Search, Format Filter & Sort Toolbar — all on one row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${activeSubject?.name || 'subject'} notes...`}
                className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Type-filter dropdown */}
              <div ref={typeFilterRef} className="relative">
                <button
                  onClick={() => setTypeFilterOpen((v) => !v)}
                  className="flex items-center gap-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={typeFilterOpen}
                >
                  <Filter className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                  <span>
                    {typeFilter === 'all' ? 'All' : typeFilter === 'pdf' ? 'PDFs' : 'Images'}
                  </span>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] transition-transform', typeFilterOpen && 'rotate-180')} />
                </button>

                {typeFilterOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl overflow-hidden z-20 py-1" role="listbox">
                    {(['all', 'pdf', 'image'] as const).map((opt) => (
                      <button
                        key={opt}
                        role="option"
                        aria-selected={typeFilter === opt}
                        onClick={() => { setTypeFilter(opt); setTypeFilterOpen(false); }}
                        className={cn(
                          'w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center gap-2',
                          typeFilter === opt
                            ? 'bg-indigo-600/15 text-indigo-400 font-semibold'
                            : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                        )}
                      >
                        {typeFilter === opt && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                        {opt === 'all' ? 'All' : opt === 'pdf' ? 'PDFs' : 'Images'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Selector */}
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

          {/* Notes Grid */}
          {isLoading && displayedNotes.length === 0 ? (
            <CardGridLoader cards={6} />
          ) : displayedNotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                searchQuery
                  ? 'No matching notes found'
                  : selectedChapterId !== 'all'
                  ? 'No notes in this chapter yet'
                  : `No notes in ${activeSubject?.name || 'this subject'} yet`
              }
              description={
                searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : `Upload your lecture slides, textbook excerpts, or handwritten diagrams for ${activeSubject?.name || 'this subject'}.`
              }
              actionLabel={`Upload Note to ${activeSubject?.name || 'Subject'}`}
              onAction={() => setIsUploadOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {displayedNotes.map((note) => {
                  const chap = note.chapter_id ? chapterMap.get(note.chapter_id) : null;
                  const top = note.topic_id ? topicMap.get(note.topic_id) : null;
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
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -3 }}
                      onClick={() => setViewerNote(note)}
                      className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {/* Top format & size badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider',
                              isPdf
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            )}
                          >
                            {isPdf ? 'PDF' : note.file_type}
                          </span>

                          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                            {formattedSize} • {note.page_count} {note.page_count === 1 ? 'page' : 'pages'}
                          </span>
                        </div>

                        {/* Document Title & Subtitle */}
                        <h3 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                          {note.title}
                        </h3>
                        {note.subtitle && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3 leading-relaxed">
                            {note.subtitle}
                          </p>
                        )}

                        {/* Linked Chapter & Topic Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {chap ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 max-w-[210px] truncate">
                              <BookOpen className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{chap.name}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]">
                              <FolderOpen className="w-2.5 h-2.5" />
                              <span>General Note</span>
                            </span>
                          )}

                          {top && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 max-w-[180px] truncate">
                              <Tag className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{top.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Date & Quick Actions */}
                      <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                        <span>{formattedDate}</span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEdit(note, e)}
                            className="p-1.5 rounded-lg hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
                            title="Edit Details & Linked Chapter"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(note);
                            }}
                            className="p-1.5 rounded-lg hover:text-rose-500 hover:bg-rose-500/10 transition"
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
        </div>
      )}

      {/* =========================================================================
          UPLOAD MODAL
          ========================================================================= */}
      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultSubjectId={selectedSubjectId || undefined}
        defaultChapterId={selectedChapterId !== 'all' ? selectedChapterId : undefined}
        defaultTopicId={selectedTopicId !== 'all' ? selectedTopicId : undefined}
      />

      {/* =========================================================================
          FULLSCREEN DOCUMENT VIEWER & ANNOTATOR
          ========================================================================= */}
      {viewerNote && (
        <DocumentViewer
          note={viewerNote}
          onClose={() => setViewerNote(null)}
          onUpdate={(updated) => {
            setViewerNote(updated);
          }}
        />
      )}

      {/* =========================================================================
          EDIT NOTE DETAILS MODAL (With Chapter & Topic Linking)
          ========================================================================= */}
      <AnimatePresence>
        {editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Edit Note Details & Linking</span>
              </h3>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                    Subtitle / Description
                  </label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    placeholder="e.g. Chapter 1-4 Slokas & Diagrammatic Explanations"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Chapter & Topic linking */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <span>Linked Curriculum (Optional)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] block mb-1">
                        Chapter
                      </label>
                      <select
                        value={editChapterId}
                        onChange={(e) => {
                          setEditChapterId(e.target.value);
                          setEditTopicId('');
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">None / Entire Subject</option>
                        {editChapters.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] block mb-1">
                        Topic
                      </label>
                      <select
                        value={editTopicId}
                        onChange={(e) => setEditTopicId(e.target.value)}
                        disabled={!editChapterId || editTopics.length === 0}
                        className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">
                          {!editChapterId
                            ? 'Select chapter first'
                            : editTopics.length === 0
                            ? 'No topics in chapter'
                            : 'None / General Chapter Note'}
                        </option>
                        {editTopics.map((top) => (
                          <option key={top.id} value={top.id}>
                            {top.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[hsl(var(--border))]">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !editTitle.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
                  >
                    {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-2xl"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-rose-500/20 transition"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
