'use client';

import React, { useRef, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Filter,
  Layers,
  BookOpen,
  Tag,
  ArrowUpDown,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject, Chapter, Topic } from '@/types';

export type NoteSortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
export type NoteFormatFilter = 'all' | 'pdf' | 'image';
export type NoteViewMode = 'grid' | 'list';

interface NotesControlsBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  subjects: Subject[];
  noteStatsBySubject: Record<string, { total: number; pdfs: number; images: number }>;
  totalNotesCount: number;
  selectedChapterId: string;
  onSelectChapter: (id: string) => void;
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  chaptersForActiveSubject: Chapter[];
  topicsForActiveChapter: Topic[];
  noteCountByChapter: Record<string, number>;
  typeFilter: NoteFormatFilter;
  onTypeFilterChange: (type: NoteFormatFilter) => void;
  formatCounts: { all: number; pdf: number; image: number };
  sortBy: NoteSortOption;
  onSortByChange: (sort: NoteSortOption) => void;
  viewMode: NoteViewMode;
  onViewModeChange: (mode: NoteViewMode) => void;
}

export function NotesControlsBar({
  searchQuery,
  onSearchChange,
  selectedSubjectId,
  onSelectSubject,
  subjects,
  noteStatsBySubject,
  totalNotesCount,
  selectedChapterId,
  onSelectChapter,
  selectedTopicId,
  onSelectTopic,
  chaptersForActiveSubject,
  topicsForActiveChapter,
  noteCountByChapter,
  typeFilter,
  onTypeFilterChange,
  formatCounts,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}: NotesControlsBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' or 'Ctrl+K' focuses search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4 mb-6">
      {/* ── Subject Filter Tabs Ribbon ────────────────────────────────────── */}
      <LayoutGroup id="notes-subject-tabs">
        <div
          className={cn(
            'flex gap-1.5 items-center p-1.5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]',
            'overflow-x-auto pb-2 sm:pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          )}
        >
          {/* All Notes tab */}
          <button
            onClick={() => onSelectSubject(null)}
            className={cn(
              'relative flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
              !selectedSubjectId
                ? 'text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60'
            )}
          >
            {!selectedSubjectId && (
              <motion.div
                layoutId="notes-subject-active-pill"
                className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
              />
            )}
            <Layers className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 whitespace-nowrap">All Notes</span>
            <span
              className={cn(
                'relative z-10 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold transition-colors',
                !selectedSubjectId
                  ? 'bg-white/20 text-white'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              )}
            >
              {totalNotesCount}
            </span>
          </button>

          {/* Individual Subject Tabs */}
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            const stats = noteStatsBySubject[sub.id] || { total: 0, pdfs: 0, images: 0 };

            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className={cn(
                  'relative flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
                  isSelected
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60'
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="notes-subject-active-pill"
                    className="absolute inset-0 rounded-xl shadow-md"
                    style={{ backgroundColor: sub.color || '#6366f1' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                  />
                )}
                <span
                  className="w-2 h-2 rounded-full shrink-0 relative z-10 shadow-sm"
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : sub.color || '#6366f1',
                  }}
                />
                <span className="relative z-10 whitespace-nowrap">{sub.name}</span>
                <span
                  className={cn(
                    'relative z-10 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold transition-colors',
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {stats.total}
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {/* ── Search Input ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search notes by title, subtitle, topic, chapter, or filename... (Press '/' to search)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 pl-10 pr-24 text-sm placeholder:text-[hsl(var(--muted-foreground))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/80 border border-[hsl(var(--border))] rounded-md">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Filters, Format Pills, Sort & View Mode Row ──────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
        {/* Left side: Curriculum (Chapter & Topic) filters if subject is active */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedSubjectId && chaptersForActiveSubject.length > 0 && (
            <>
              {/* Chapter Dropdown */}
              <div className="relative flex items-center">
                <BookOpen className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] absolute left-3 pointer-events-none" />
                <select
                  value={selectedChapterId}
                  onChange={(e) => {
                    onSelectChapter(e.target.value);
                    onSelectTopic('all');
                  }}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-8 pr-7 py-2 text-xs font-medium text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
                >
                  <option value="all">All Chapters</option>
                  {chaptersForActiveSubject.map((ch) => {
                    const count = noteCountByChapter[ch.id] || 0;
                    return (
                      <option key={ch.id} value={ch.id}>
                        {ch.name} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Topic Dropdown */}
              {selectedChapterId !== 'all' && topicsForActiveChapter.length > 0 && (
                <div className="relative flex items-center">
                  <Tag className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] absolute left-3 pointer-events-none" />
                  <select
                    value={selectedTopicId}
                    onChange={(e) => onSelectTopic(e.target.value)}
                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-8 pr-7 py-2 text-xs font-medium text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
                  >
                    <option value="all">All Topics</option>
                    {topicsForActiveChapter.map((top) => (
                      <option key={top.id} value={top.id}>
                        {top.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Format Filter Pills (All / PDFs / Images) */}
          <div className="flex items-center p-1 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] gap-1">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5',
                typeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
            >
              <span>All</span>
              <span className={cn('text-[10px] px-1 rounded-full', typeFilter === 'all' ? 'bg-white/20' : 'bg-[hsl(var(--muted))]')}>
                {formatCounts.all}
              </span>
            </button>

            <button
              onClick={() => onTypeFilterChange('pdf')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5',
                typeFilter === 'pdf'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>PDFs</span>
              <span className={cn('text-[10px] px-1 rounded-full', typeFilter === 'pdf' ? 'bg-white/20' : 'bg-[hsl(var(--muted))]')}>
                {formatCounts.pdf}
              </span>
            </button>

            <button
              onClick={() => onTypeFilterChange('image')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5',
                typeFilter === 'image'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Images</span>
              <span className={cn('text-[10px] px-1 rounded-full', typeFilter === 'image' ? 'bg-white/20' : 'bg-[hsl(var(--muted))]')}>
                {formatCounts.image}
              </span>
            </button>
          </div>
        </div>

        {/* Right side: Sort Selector & Grid/List View Mode Toggle */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as NoteSortOption)}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-8 pr-7 py-2 text-xs font-medium text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title (A - Z)</option>
              <option value="title-desc">Title (Z - A)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] gap-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded-lg text-xs transition-colors',
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 rounded-lg text-xs transition-colors',
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
              title="Compact List View"
              aria-label="Compact List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
