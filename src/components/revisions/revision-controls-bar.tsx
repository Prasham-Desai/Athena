'use client';

import { motion } from 'framer-motion';
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
  allExpanded: boolean;
  onToggleExpandAll: () => void;
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
  allExpanded,
  onToggleExpandAll,
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
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter pills — horizontal scroll on mobile, wrap on desktop */}
        <div
          className={cn(
            'flex gap-2 sm:flex-wrap',
            'flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-x-visible',
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
                  'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-white'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                )}
              >
                {opt.label}
                <span
                  className={cn(
                    'ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-semibold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2">
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
          <div className="flex items-center rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
              )}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Expand / Collapse All */}
          <button
            onClick={onToggleExpandAll}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
              'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
            )}
            aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
          >
            {allExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
