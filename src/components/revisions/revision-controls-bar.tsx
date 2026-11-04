'use client';

import { motion, LayoutGroup } from 'framer-motion';
import {
  Search,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Exported types — used by revisions pages
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
  sortBy: RevisionSort;
  onSortChange: (sort: RevisionSort) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------
const SORT_OPTIONS: { value: RevisionSort; label: string }[] = [
  { value: 'progress', label: 'Progress' },
  { value: 'name', label: 'Name' },
  { value: 'due-count', label: 'Due Count' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RevisionControlsBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: RevisionControlsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-4 sm:mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search subjects..."
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

        {/* Right side controls: Sort + View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as RevisionSort)}
            className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 pr-8 text-xs font-medium text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 transition appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.6rem center',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <LayoutGroup id="revision-view-mode-tabs">
            <div className="relative flex items-center p-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] h-10">
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'relative z-10 p-1.5 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer',
                  viewMode === 'list'
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
                aria-label="List view"
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="revision-view-mode-pill"
                    className="absolute inset-0 bg-[hsl(var(--primary))] rounded-lg shadow-sm gpu-smooth"
                    style={{ willChange: 'transform' }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <List className="relative z-10 h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  'relative z-10 p-1.5 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer',
                  viewMode === 'grid'
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
                aria-label="Grid view"
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="revision-view-mode-pill"
                    className="absolute inset-0 bg-[hsl(var(--primary))] rounded-lg shadow-sm gpu-smooth"
                    style={{ willChange: 'transform' }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <LayoutGrid className="relative z-10 h-4 w-4" />
              </button>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </motion.div>
  );
}
