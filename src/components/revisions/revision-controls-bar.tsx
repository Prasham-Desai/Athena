'use client';

import { motion, LayoutGroup } from 'framer-motion';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Exported types — used by the revisions page
// ---------------------------------------------------------------------------
export type RevisionFilter = 'all' | 'due' | 'revised' | 'not-revised';
export type RevisionSort = 'name' | 'progress' | 'due-count';
export type ViewMode = 'list' | 'grid';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RevisionControlsBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: RevisionFilter;
  onFilterChange: (filter: RevisionFilter) => void;
  sortBy: RevisionSort;
  onSortChange: (sort: RevisionSort) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCounts: {
    all: number;
    due: number;
    revised: number;
    notRevised: number;
  };
}

// ---------------------------------------------------------------------------
// Filter pill config
// ---------------------------------------------------------------------------
const FILTER_OPTIONS: {
  value: RevisionFilter;
  label: string;
  countKey: keyof RevisionControlsBarProps['filterCounts'];
}[] = [
  { value: 'all', label: 'All', countKey: 'all' },
  { value: 'due', label: 'Due for Revision', countKey: 'due' },
  { value: 'revised', label: 'Revised', countKey: 'revised' },
  { value: 'not-revised', label: 'Not Revised', countKey: 'notRevised' },
];

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------
const SORT_OPTIONS: { value: RevisionSort; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'progress', label: 'Progress' },
  { value: 'due-count', label: 'Due Count' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RevisionControlsBar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filterCounts,
}: RevisionControlsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-4 sm:mb-6 space-y-3"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Row 1 — Search                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search subjects, chapters, or topics…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 pl-10 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Row 2 — Filters + Sort + View Toggle + Expand/Collapse            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between min-w-0">
        {/* Filter pills — horizontal scroll on mobile, wrap on desktop */}
        <LayoutGroup id="revision-filter-tabs">
          <div
            className={cn(
              'flex gap-1.5 sm:flex-wrap w-full sm:w-auto relative items-center p-1 rounded-xl bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))]/50',
              'flex-nowrap overflow-x-auto pb-1 sm:pb-1 sm:overflow-x-visible',
              '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
            )}
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = filter === opt.value;
              const count = filterCounts[opt.countKey];

              return (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange(opt.value)}
                  className={cn(
                    'relative flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'text-white'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="revision-filter-active-pill"
                      className="absolute inset-0 bg-[hsl(var(--primary))] rounded-lg shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                  <span
                    className={cn(
                      'relative z-10 ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-semibold transition-colors duration-150',
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Right side controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as RevisionSort)}
            className="h-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 pr-7 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 transition appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <LayoutGroup id="revision-view-mode-tabs">
            <div className="relative flex items-center p-0.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'relative z-10 p-1.5 rounded-md transition-colors duration-150',
                  viewMode === 'list'
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
                aria-label="List view"
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="revision-view-mode-pill"
                    className="absolute inset-0 bg-[hsl(var(--primary))] rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                  />
                )}
                <List className="relative z-10 h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'relative z-10 p-1.5 rounded-md transition-colors duration-150',
                  viewMode === 'grid'
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
                aria-label="Grid view"
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="revision-view-mode-pill"
                    className="absolute inset-0 bg-[hsl(var(--primary))] rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                  />
                )}
                <LayoutGrid className="relative z-10 h-3.5 w-3.5" />
              </button>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </motion.div>
  );
}
