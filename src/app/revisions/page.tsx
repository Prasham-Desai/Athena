'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

import { useSubjectsStore } from '@/store/subjects-store';
import { useActivityStore } from '@/store/activity-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, isOverdue, isToday } from '@/lib/utils';
import type { Subject } from '@/types';

import { RevisionStatsHeader } from '@/components/revisions/revision-stats-header';
import { RevisionControlsBar, type RevisionFilter, type RevisionSort, type ViewMode } from '@/components/revisions/revision-controls-bar';
import { RevisionSubjectCard } from '@/components/revisions/revision-subject-card';

export default function RevisionsPage() {
  const hydrated = useHydration();

  const subjects = useSubjectsStore((s) => s.subjects);
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RevisionFilter>('all');
  const [sortBy, setSortBy] = useState<RevisionSort>('progress');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Compute counts for filters
  const filterCounts = useMemo(() => {
    let all = 0, due = 0, revised = 0, notRevised = 0;
    
    subjects.forEach(s => {
      s.chapters.forEach(c => {
        c.topics.forEach(t => {
          all++;
          const isRevisable = t.status === 'completed' || t.status === 'revised';
          if (isRevisable) {
            const hasRevisions = t.revisionCount > 0;
            const isTopicDue = t.nextRevisionDue && (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue));
            
            if (isTopicDue) due++;
            if (hasRevisions) revised++;
            if (!hasRevisions) notRevised++;
          }
        });
      });
    });

    return { all, due, revised, notRevised };
  }, [subjects]);

  // Filter and sort subjects
  const filteredAndSortedSubjects = useMemo(() => {
    let result = [...subjects];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        if (s.name.toLowerCase().includes(q)) return true;
        return s.chapters.some(c => 
          c.name.toLowerCase().includes(q) ||
          c.topics.some(t => t.name.toLowerCase().includes(q))
        );
      });
    }

    // Status filter (this filters out subjects that don't have ANY topics matching the criteria)
    if (filter !== 'all') {
      result = result.filter(s => {
        return s.chapters.some(c => {
          return c.topics.some(t => {
            const isRevisable = t.status === 'completed' || t.status === 'revised';
            if (!isRevisable) return false;
            
            if (filter === 'due') {
              return t.nextRevisionDue && (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue));
            }
            if (filter === 'revised') {
              return t.revisionCount > 0;
            }
            if (filter === 'not-revised') {
              return t.revisionCount === 0;
            }
            return true;
          });
        });
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      
      const getSubjectStats = (subject: Subject) => {
        let total = 0, revised = 0, due = 0;
        subject.chapters.forEach(c => {
          c.topics.forEach(t => {
            total++;
            if (t.revisionCount > 0) revised++;
            if ((t.status === 'completed' || t.status === 'revised') && t.nextRevisionDue && (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue))) {
              due++;
            }
          });
        });
        const progress = total > 0 ? (revised / total) : 0;
        return { progress, due };
      };

      const statsA = getSubjectStats(a);
      const statsB = getSubjectStats(b);

      if (sortBy === 'progress') return statsB.progress - statsA.progress;
      if (sortBy === 'due-count') return statsB.due - statsA.due;
      
      return 0;
    });

    return result;
  }, [subjects, searchQuery, filter, sortBy]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[hsl(var(--muted-foreground))] animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <PageHeader
        title="Revisions"
        description="Repetition is the mother of learning — each revision makes you stronger! 🧠"
      />

      <RevisionStatsHeader subjects={subjects} />

      <div className="my-6" />

      {subjects.length > 0 ? (
        <>
          <RevisionControlsBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterCounts={filterCounts}
          />

          {filteredAndSortedSubjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No topics found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery('');
                setFilter('all');
              }}
            />
          ) : (
            <motion.div 
              layout
              className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              )}
            >
              <AnimatePresence mode="popLayout">
                {filteredAndSortedSubjects.map((subject, idx) => (
                  <RevisionSubjectCard
                    key={subject.id}
                    subject={subject}
                    index={idx}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add subjects in the Subjects page. Complete topics there, then come here to track revisions."
        />
      )}
    </div>
  );
}
