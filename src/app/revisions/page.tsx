'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

import { useSubjectsStore } from '@/store/subjects-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, isOverdue, isToday } from '@/lib/utils';
import type { Subject } from '@/types';

import { RevisionStatsHeader } from '@/components/revisions/revision-stats-header';
import { RevisionControlsBar, type RevisionSort, type ViewMode } from '@/components/revisions/revision-controls-bar';
import { SubjectCard } from '@/components/shared/subject-card';
import { getSubjectDisplayName } from '@/lib/subject-display';
import { CardGridLoader, PageLoader } from '@/components/ui/loading';

export default function RevisionsPage() {
  const hydrated = useHydration();

  const subjects = useSubjectsStore((s) => s.subjects);
  const subjectsLoading = useSubjectsStore((s) => s.isLoading);

  // Local state for subject selection
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<RevisionSort>('progress');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and sort subjects for revision
  const filteredAndSortedSubjects = useMemo(() => {
    let result = [...subjects];

    // Search filter across subjects, chapters, and topics
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        if (getSubjectDisplayName(s).toLowerCase().includes(q)) return true;
        return s.chapters.some(c => 
          c.name.toLowerCase().includes(q) ||
          c.topics.some(t => t.name.toLowerCase().includes(q))
        );
      });
    }

    // Sort subjects
    result.sort((a, b) => {
      if (sortBy === 'name') return getSubjectDisplayName(a).localeCompare(getSubjectDisplayName(b));
      
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
  }, [subjects, searchQuery, sortBy]);

  if (!hydrated) {
    return <PageLoader label="Loading revisions" variant="cards" />;
  }

  return (
    <div className="relative pb-24">
      <PageHeader
        title="Revisions"
        description="Repetition is the mother of learning — each revision makes you stronger! 🧠"
      />

      <RevisionStatsHeader subjects={subjects} isLoading={subjectsLoading} />

      <div className="my-6" />

      {subjectsLoading ? (
        <CardGridLoader cards={4} />
      ) : subjects.length > 0 ? (
        <>
          <RevisionControlsBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {filteredAndSortedSubjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects found"
              description="Try adjusting your search query to find what you're looking for."
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
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
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    index={idx}
                    variant="revisions"
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
