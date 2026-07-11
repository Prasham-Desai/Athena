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
import { RevisionUndoToast, type UndoEntry } from '@/components/revisions/revision-undo-toast';

export default function RevisionsPage() {
  const hydrated = useHydration();

  const subjects = useSubjectsStore((s) => s.subjects);
  const markTopicRevised = useSubjectsStore((s) => s.markTopicRevised);
  const undoRevision = useSubjectsStore((s) => s.undoRevision);
  const { addActivity } = useActivityStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RevisionFilter>('all');
  const [sortBy, setSortBy] = useState<RevisionSort>('progress');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [undoEntries, setUndoEntries] = useState<UndoEntry[]>([]);

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

  // Handlers
  const handleMarkRevised = useCallback((subjectId: string, chapterId: string, topicId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    const topic = chapter?.topics.find((t) => t.id === topicId);
    if (!subject || !chapter || !topic) return;

    if (topic.status !== 'completed' && topic.status !== 'revised') {
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: 'Complete this topic in Subjects first!', type: 'error' } })
      );
      return;
    }

    markTopicRevised(subjectId, chapterId, topicId);
    
    // Add to undo stack
    setUndoEntries(prev => [...prev, {
      topicId,
      topicName: topic.name,
      subjectName: subject.name,
      chapterId,
      subjectId,
      timestamp: Date.now()
    }]);

    addActivity({
      type: 'topic-revised',
      description: `Revised "${topic.name}" (×${topic.revisionCount + 1})`,
      subjectId,
      color: subject.color,
    });
    
  }, [subjects, markTopicRevised, addActivity]);

  const handleReviseAllInChapter = useCallback((subjectId: string, chapterId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    if (!subject || !chapter) return;

    let count = 0;
    const newUndoEntries: UndoEntry[] = [];
    
    chapter.topics.forEach((topic) => {
      if (topic.status === 'completed' || topic.status === 'revised') {
        markTopicRevised(subjectId, chapterId, topic.id);
        count++;
        newUndoEntries.push({
          topicId: topic.id,
          topicName: topic.name,
          subjectName: subject.name,
          chapterId,
          subjectId,
          timestamp: Date.now()
        });
      }
    });

    if (count > 0) {
      setUndoEntries(prev => [...prev, ...newUndoEntries]);
      addActivity({
        type: 'topic-revised',
        description: `Revised ${count} topics in "${chapter.name}"`,
        subjectId,
        color: subject.color,
        count: count,
      });
    }
  }, [subjects, markTopicRevised, addActivity]);

  const handleUndo = useCallback((entry: UndoEntry) => {
    undoRevision(entry.subjectId, entry.chapterId, entry.topicId);
    setUndoEntries(prev => prev.filter(e => e.topicId !== entry.topicId));
  }, [undoRevision]);

  const handleUndoAll = useCallback(() => {
    undoEntries.forEach(entry => {
      undoRevision(entry.subjectId, entry.chapterId, entry.topicId);
    });
    setUndoEntries([]);
  }, [undoEntries, undoRevision]);

  const handleDismissUndo = useCallback(() => {
    setUndoEntries([]);
  }, []);

  const toggleSubjectExpand = useCallback((subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  }, []);

  const toggleExpandAll = useCallback(() => {
    if (expandedSubjects.size === filteredAndSortedSubjects.length && filteredAndSortedSubjects.length > 0) {
      setExpandedSubjects(new Set());
    } else {
      setExpandedSubjects(new Set(filteredAndSortedSubjects.map(s => s.id)));
    }
  }, [expandedSubjects.size, filteredAndSortedSubjects]);

  const undoableTopicsSet = useMemo(() => new Set(undoEntries.map(e => e.topicId)), [undoEntries]);

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
            allExpanded={expandedSubjects.size === filteredAndSortedSubjects.length && filteredAndSortedSubjects.length > 0}
            onToggleExpandAll={toggleExpandAll}
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
                    isExpanded={expandedSubjects.has(subject.id)}
                    onToggleExpand={() => toggleSubjectExpand(subject.id)}
                    onMarkRevised={(chapterId, topicId) => handleMarkRevised(subject.id, chapterId, topicId)}
                    onReviseAllInChapter={(chapterId) => handleReviseAllInChapter(subject.id, chapterId)}
                    onUndoRevision={(chapterId, topicId) => {
                      const entry = undoEntries.find(e => e.topicId === topicId);
                      if (entry) handleUndo(entry);
                    }}
                    undoableTopics={undoableTopicsSet}
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

      {/* Undo Toast */}
      <AnimatePresence>
        {undoEntries.length > 0 && (
          <RevisionUndoToast
            entries={undoEntries}
            onUndo={handleUndo}
            onUndoAll={handleUndoAll}
            onDismiss={handleDismissUndo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
