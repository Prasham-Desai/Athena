'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  BookOpen,
  ArrowLeft,
  Layers,
  Clock,
  Plus,
  FileText,
  FolderOpen,
} from 'lucide-react';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useNotesStore } from '@/store/notes-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { CardGridLoader, PageLoader } from '@/components/ui/loading';
import { UploadNotesModal } from '@/components/notes/upload-notes-modal';
import { DocumentViewer } from '@/components/notes/document-viewer';
import { NotesStatsHeader } from '@/components/notes/notes-stats-header';
import {
  NotesControlsBar,
  type NoteSortOption,
  type NoteFormatFilter,
  type NoteViewMode,
} from '@/components/notes/notes-controls-bar';
import { NoteCard } from '@/components/notes/note-card';
import { SubjectCard } from '@/components/shared/subject-card';
import { EditNoteModal } from '@/components/notes/edit-note-modal';
import { DeleteNoteModal } from '@/components/notes/delete-note-modal';
import type { NoteDocument, Chapter, Topic } from '@/types';
import { cn } from '@/lib/utils';
import { getSubjectDisplayName } from '@/lib/subject-display';

export default function NotesPage() {
  const isHydrated = useHydration();
  const { activeYearId, activeYear, isSwitching, setActiveYearId } = useAcademicYearStore();
  const { subjects, fetchSubjects } = useSubjectsStore();
  const { notes, isLoading, fetchNotes, deleteNote, updateNote } = useNotesStore();

  // Navigation state: null = All Notes / Subjects overview, string = Selected Subject Workspace
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Filters within a subject or globally
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<NoteFormatFilter>('all');
  const [sortBy, setSortBy] = useState<NoteSortOption>('date-desc');
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid');

  // Modals & Document Viewer
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [viewerNote, setViewerNote] = useState<NoteDocument | null>(null);
  const [editTarget, setEditTarget] = useState<NoteDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoteDocument | null>(null);
  const initializedYear = useRef(false);
  const linkedYear = useRef<string | null>(null);

  // Load notes and subjects on mount & academic year switch
  useEffect(() => {
    if (activeYearId) {
      const firstYearLoad = !initializedYear.current;
      if (firstYearLoad) {
        initializedYear.current = true;
        const params = new URLSearchParams(window.location.search);
        const requestedYear = params.get('yearId');
        const requestedYearExists = requestedYear && useAcademicYearStore.getState().years.some((year) => year.id === requestedYear);
        if (requestedYearExists && requestedYear !== activeYearId) {
          linkedYear.current = requestedYear;
          void setActiveYearId(requestedYear);
          return;
        }
      } else if (linkedYear.current === activeYearId) {
        linkedYear.current = null;
        setSelectedChapterId('all');
        setSelectedTopicId('all');
        return;
      }

      setSelectedSubjectId(null);
      setSelectedChapterId('all');
      setSelectedTopicId('all');
      if (!firstYearLoad) {
        const url = new URL(window.location.href);
        url.searchParams.delete('subjectId');
        url.searchParams.set('yearId', activeYearId);
        window.history.replaceState({}, '', url.toString());
      }
      fetchNotes(activeYearId);
      fetchSubjects(activeYearId);
    }
  }, [activeYearId, fetchNotes, fetchSubjects, setActiveYearId]);

  // Read URL query params on mount to support direct linking (e.g. from subjects/[id])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSubjectId = params.get('subjectId');
      if (urlSubjectId) {
        setSelectedSubjectId(urlSubjectId);
      }
    }
  }, []);

  // If a subject was selected from URL or state but does not exist in subjects list, reset
  useEffect(() => {
    if (
      selectedSubjectId &&
      !isSwitching &&
      subjects.length > 0 &&
      !subjects.some((s) => s.id === selectedSubjectId)
    ) {
      setSelectedSubjectId(null);
    }
  }, [selectedSubjectId, subjects, isSwitching]);

  // Sync browser URL when subject changes
  const handleSelectSubject = useCallback((subjectId: string | null) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('all');
    setSelectedTopicId('all');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (subjectId) {
        url.searchParams.set('subjectId', subjectId);
        url.searchParams.set('yearId', activeYearId);
      } else {
        url.searchParams.delete('subjectId');
        url.searchParams.set('yearId', activeYearId);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeYearId]);

  // Active Subject details
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

  // Format counts for currently selected subject context
  const formatCounts = useMemo(() => {
    const relevantNotes = selectedSubjectId
      ? notes.filter((n) => n.subject_id === selectedSubjectId)
      : notes;
    const all = relevantNotes.length;
    const pdf = relevantNotes.filter((n) => n.file_type === 'pdf').length;
    const image = relevantNotes.filter((n) => n.file_type !== 'pdf').length;
    return { all, pdf, image };
  }, [notes, selectedSubjectId]);

  // Chapters & Topics for active subject
  const chaptersForActiveSubject = useMemo(() => {
    return activeSubject?.chapters || [];
  }, [activeSubject]);

  const topicsForActiveChapter = useMemo(() => {
    if (selectedChapterId === 'all') return [];
    const ch = chaptersForActiveSubject.find((c) => c.id === selectedChapterId);
    return ch?.topics || [];
  }, [selectedChapterId, chaptersForActiveSubject]);

  // Filtered notes for current view
  const displayedNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Enforce subject filter if selected
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

  // Delete note handler
  const handleConfirmDelete = async (noteId: string) => {
    await deleteNote(noteId);
    if (viewerNote?.id === noteId) {
      setViewerNote(null);
    }
  };

  // Update note handler
  const handleSaveEdit = async (
    noteId: string,
    data: {
      title: string;
      subtitle?: string;
      chapter_id?: string | null;
      topic_id?: string | null;
    }
  ) => {
    const updated = await updateNote(noteId, data);
    if (viewerNote?.id === noteId) {
      setViewerNote(updated);
    }
  };

  // Filter subjects by search query (must be before early return to satisfy Rules of Hooks)
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim() || selectedSubjectId) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter((s) => {
      if (getSubjectDisplayName(s).toLowerCase().includes(q)) return true;
      return s.chapters?.some((c) => c.name.toLowerCase().includes(q));
    });
  }, [subjects, searchQuery, selectedSubjectId]);

  if (!isHydrated) {
    return <PageLoader label="Loading notes workspace" variant="cards" />;
  }

  const isOverview = !selectedSubjectId;

  return (
    <div className="relative pb-24 space-y-6">
      {/* ── Page Header matching Athena standard ───────────────────────────── */}
      <PageHeader
        title="Notes"
        description="Your centralized library of lecture slides, textbook excerpts, and annotated diagrams."
      >
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
      </PageHeader>

      {/* ── Key Performance Metrics Header ─────────────────────────────────── */}
      <NotesStatsHeader notes={notes} subjects={subjects} isLoading={isLoading} />

      {/* ── Workspace Controls Bar (Subject Tabs, Search, Filters, Sort, View) ── */}
      <NotesControlsBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={handleSelectSubject}
        subjects={subjects}
        noteStatsBySubject={noteStatsBySubject}
        totalNotesCount={notes.length}
        selectedChapterId={selectedChapterId}
        onSelectChapter={setSelectedChapterId}
        selectedTopicId={selectedTopicId}
        onSelectTopic={setSelectedTopicId}
        chaptersForActiveSubject={chaptersForActiveSubject}
        topicsForActiveChapter={topicsForActiveChapter}
        noteCountByChapter={noteCountByChapter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        formatCounts={formatCounts}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* ── Main Workspace Content ─────────────────────────────────────────── */}
      {isLoading && notes.length === 0 ? (
        <CardGridLoader cards={6} />
      ) : (
        <div className="space-y-8">
          {/* ── OVERVIEW MODE: SUBJECT NOTEBOOKS ONLY ────────────────────────── */}
          {!selectedSubjectId ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Subject Notebooks</span>
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Select a subject to view and manage its study documents, notes, and diagrams.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                  {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'} total
                </span>
              </div>

              {filteredSubjects.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title={searchQuery ? `No subjects match "${searchQuery}"` : `No subjects found for ${activeYear?.name}`}
                  description={searchQuery ? 'Try adjusting your search terms.' : 'Create subjects in your curriculum to organize lecture notes and diagrams.'}
                  actionLabel={searchQuery ? 'Clear Search' : undefined}
                  onAction={searchQuery ? () => setSearchQuery('') : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubjects.map((sub, idx) => {
                    const stats = noteStatsBySubject[sub.id] || { total: 0, pdfs: 0, images: 0 };
                    return (
                      <SubjectCard
                        key={sub.id}
                        subject={sub}
                        index={idx}
                        variant="notes"
                        noteStats={stats}
                        onSelect={handleSelectSubject}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            /* ── ACTIVE SUBJECT WORKSPACE: ONLY THIS SUBJECT'S NOTES ────────── */
            <div className="space-y-6">
              {/* Active Subject Context Banner */}
              {activeSubject && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-lg"
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
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                        style={{ backgroundColor: activeSubject.color || '#6366f1' }}
                      >
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-[hsl(var(--foreground))]">
                            {activeYear?.name || 'Academic Year'}
                          </span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {activeSubject.chapters?.length || 0} chapters
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-[hsl(var(--foreground))]">
                          {getSubjectDisplayName(activeSubject)} Notes
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSelectSubject(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-[hsl(var(--foreground))] border border-[hsl(var(--border))]/50 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>All Subjects</span>
                      </button>
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                        style={{
                          backgroundColor: activeSubject.color || '#6366f1',
                          boxShadow: `0 10px 25px -5px ${activeSubject.color || '#6366f1'}40`,
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload Note</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Subject Notes List/Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                      {displayedNotes.length} {displayedNotes.length === 1 ? 'Document' : 'Documents'} in {activeSubject?.name}
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Open documents to study with full canvas annotation tools.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectSubject(null)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Switch Subject</span>
                  </button>
                </div>

                {displayedNotes.length === 0 ? (
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
                        : `Upload lecture slides, textbook excerpts, or handwritten diagrams for ${activeSubject?.name || 'this subject'}.`
                    }
                    actionLabel={
                      searchQuery
                        ? 'Clear Search & Filters'
                        : `Upload Note to ${activeSubject?.name || 'Subject'}`
                    }
                    onAction={() => {
                      if (searchQuery) {
                        setSearchQuery('');
                        setTypeFilter('all');
                        setSelectedChapterId('all');
                        setSelectedTopicId('all');
                      } else {
                        setIsUploadOpen(true);
                      }
                    }}
                  />
                ) : (
                  <motion.div
                    layout
                    className={cn(
                      'grid gap-4',
                      viewMode === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                    )}
                  >
                    <AnimatePresence mode="popLayout">
                      {displayedNotes.map((note) => {
                        const sub = subjects.find((s) => s.id === note.subject_id);
                        const chap = note.chapter_id ? chapterMap.get(note.chapter_id) : null;
                        const top = note.topic_id ? topicMap.get(note.topic_id) : null;

                        return (
                          <NoteCard
                            key={note.id}
                            note={note}
                            subject={sub}
                            chapter={chap}
                            topic={top}
                            viewMode={viewMode}
                            showSubjectPill={false}
                            onOpen={(n) => setViewerNote(n)}
                            onEdit={(n, e) => {
                              e.stopPropagation();
                              setEditTarget(n);
                            }}
                            onDelete={(n, e) => {
                              e.stopPropagation();
                              setDeleteTarget(n);
                            }}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {/* ── UPLOAD MODAL ────────────────────────────────────────────────────── */}
      <UploadNotesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultSubjectId={selectedSubjectId || undefined}
        defaultChapterId={selectedChapterId !== 'all' ? selectedChapterId : undefined}
        defaultTopicId={selectedTopicId !== 'all' ? selectedTopicId : undefined}
      />

      {/* ── FULLSCREEN DOCUMENT VIEWER & ANNOTATOR ──────────────────────────── */}
      {viewerNote && (
        <DocumentViewer
          note={viewerNote}
          onClose={() => setViewerNote(null)}
          onUpdate={(updated) => {
            setViewerNote(updated);
          }}
        />
      )}

      {/* ── EDIT NOTE MODAL ─────────────────────────────────────────────────── */}
      <EditNoteModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        note={editTarget}
        subjects={subjects}
        onSave={handleSaveEdit}
      />

      {/* ── DELETE NOTE MODAL ───────────────────────────────────────────────── */}
      <DeleteNoteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        note={deleteTarget}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
