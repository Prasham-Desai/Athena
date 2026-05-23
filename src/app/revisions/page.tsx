'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  ChevronRight,
  Plus,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Lock,
} from 'lucide-react';

import { useSubjectsStore } from '@/store/subjects-store';
import { useActivityStore } from '@/store/activity-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { ProgressRing } from '@/components/shared/progress-ring';
import { StatCard } from '@/components/shared/stat-card';
import { cn, STATUS_CONFIG } from '@/lib/utils';

// ==========================================================================
// Completion Analysis
// ==========================================================================

function CompletionAnalysis({ subjects }: { subjects: any[] }) {
  const analysis = useMemo(() => {
    return subjects.map((s) => {
      const allTopics = s.chapters.flatMap((c: any) => c.topics);
      const total = allTopics.length;
      const completed = allTopics.filter((t: any) => t.status === 'completed' || t.status === 'revised').length;
      const revised = allTopics.filter((t: any) => t.revisionCount > 0).length;
      const totalRevisions = allTopics.reduce((sum: number, t: any) => sum + t.revisionCount, 0);

      return {
        id: s.id,
        name: s.name,
        color: s.color,
        total,
        completed,
        revised,
        totalRevisions,
        completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        revisionPercent: total > 0 ? Math.round((revised / total) * 100) : 0,
      };
    });
  }, [subjects]);

  const overallRevised = analysis.reduce((s, a) => s + a.revised, 0);
  const overallTotal = analysis.reduce((s, a) => s + a.total, 0);
  const overallPercent = overallTotal > 0 ? Math.round((overallRevised / overallTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
    >
      <h3 className="text-base font-semibold mb-1">Revision Completion Analysis</h3>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5">
        Track how much of each subject has been revised at least once
      </p>

      {/* Overall bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium">Overall Revision Coverage</span>
          <span className="text-xs font-bold text-indigo-400">{overallPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallPercent}%` }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
          {overallRevised} of {overallTotal} topics revised at least once
        </p>
      </div>

      {/* Per-subject breakdown */}
      <div className="space-y-3">
        {analysis.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-xs font-medium flex-1 min-w-0 truncate">{item.name}</span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">
              {item.revised}/{item.total}
            </span>
            <div className="w-24 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden shrink-0">
              <motion.div
                className="h-full rounded-full"
                style={{ background: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${item.revisionPercent}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />
            </div>
            <span className="text-[10px] font-bold w-8 text-right shrink-0" style={{ color: item.color }}>
              {item.revisionPercent}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ==========================================================================
// Subject Curriculum Accordion
// ==========================================================================

function SubjectCurriculum({
  subject,
  onMarkRevised,
  onReviseAllInChapter,
}: {
  subject: any;
  onMarkRevised: (chapterId: string, topicId: string) => void;
  onReviseAllInChapter: (chapterId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const allTopics = subject.chapters.flatMap((c: any) => c.topics);
  const revisedTopics = allTopics.filter((t: any) => t.revisionCount > 0);
  const completedTopics = allTopics.filter((t: any) => t.status === 'completed' || t.status === 'revised');
  const completionPercent = allTopics.length > 0 ? Math.round((revisedTopics.length / allTopics.length) * 100) : 0;

  const toggleChapter = (chId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chId)) next.delete(chId);
      else next.add(chId);
      return next;
    });
  };

  return (
    <motion.div
      layout
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
    >
      {/* Subject Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-[hsl(var(--muted)/0.5)] transition text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${subject.color}20` }}>
          <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">{subject.name}</h3>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {subject.chapters.length} chapters · {allTopics.length} topics · {completedTopics.length} completed · {revisedTopics.length} revised
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block">
            <ProgressRing value={completionPercent} size={40} strokeWidth={4} color={subject.color} />
          </div>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </motion.div>
        </div>
      </button>

      {/* Chapters & Topics */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[hsl(var(--border))] px-4 sm:px-5 pb-4 pt-2 space-y-2">
              {subject.chapters.map((chapter: any) => {
                const chExpanded = expandedChapters.has(chapter.id);
                const chTopics = chapter.topics;
                const chCompleted = chTopics.filter((t: any) => t.status === 'completed' || t.status === 'revised');
                const chRevised = chTopics.filter((t: any) => t.revisionCount > 0).length;

                return (
                  <div key={chapter.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="flex-1 flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-[hsl(var(--muted))] transition text-left"
                      >
                        <motion.div animate={{ rotate: chExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                          <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                        </motion.div>
                        <span className="text-sm font-medium flex-1">{chapter.name}</span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {chRevised}/{chTopics.length} revised
                        </span>
                      </button>
                      {/* Revise all completed topics in chapter */}
                      {chCompleted.length > 0 && (
                        <button
                          onClick={() => onReviseAllInChapter(chapter.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-medium hover:bg-violet-500/20 transition shrink-0 flex items-center gap-1"
                          title="Revise all completed topics in this chapter"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Revise All
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {chExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 space-y-1 py-1">
                            {chTopics.map((topic: any) => {
                              const isCompleted = topic.status === 'completed' || topic.status === 'revised';
                              const hasRevisions = topic.revisionCount > 0;

                              return (
                                <motion.div
                                  key={topic.id}
                                  layout
                                  className={cn(
                                    'flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition group',
                                    isCompleted
                                      ? 'hover:bg-[hsl(var(--muted)/0.5)]'
                                      : 'opacity-50'
                                  )}
                                >
                                  {/* Completion indicator */}
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                                  )}

                                  {/* Topic name */}
                                  <span className={cn(
                                    'text-xs flex-1 min-w-0 truncate',
                                    !isCompleted && 'italic'
                                  )}>
                                    {topic.name}
                                    {!isCompleted && (
                                      <span className="text-[9px] ml-1.5 text-[hsl(var(--muted-foreground))]">
                                        (complete in Subjects first)
                                      </span>
                                    )}
                                  </span>

                                  {/* Revision count badge */}
                                  {hasRevisions && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 shrink-0">
                                      ×{topic.revisionCount} revised
                                    </span>
                                  )}

                                  {/* Revision actions — only for completed topics */}
                                  {isCompleted && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Add extra revision */}
                                      <button
                                        onClick={() => onMarkRevised(chapter.id, topic.id)}
                                        title={hasRevisions ? 'Add another revision' : 'Mark first revision'}
                                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-medium hover:opacity-90 transition flex items-center gap-1 shadow-sm"
                                      >
                                        {hasRevisions ? (
                                          <>
                                            <Plus className="w-3 h-3" />
                                            Revise Again
                                          </>
                                        ) : (
                                          <>
                                            <RotateCcw className="w-3 h-3" />
                                            Revise
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}

                            {chTopics.length === 0 && (
                              <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center py-3 italic">
                                No topics in this chapter
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================================================
// Main Revisions Page
// ==========================================================================

export default function RevisionsPage() {
  const hydrated = useHydration();

  const subjects = useSubjectsStore((s) => s.subjects);
  const markTopicRevised = useSubjectsStore((s) => s.markTopicRevised);
  const { addActivity } = useActivityStore();

  // Stats
  const stats = useMemo(() => {
    let totalTopics = 0;
    let completedTopics = 0;
    let revisedAtLeastOnce = 0;
    let totalRevisionCount = 0;

    subjects.forEach((s) => {
      s.chapters.forEach((c) => {
        c.topics.forEach((t) => {
          totalTopics++;
          if (t.status === 'completed' || t.status === 'revised') completedTopics++;
          if (t.revisionCount > 0) revisedAtLeastOnce++;
          totalRevisionCount += t.revisionCount;
        });
      });
    });

    return { totalTopics, completedTopics, revisedAtLeastOnce, totalRevisionCount };
  }, [subjects]);

  const handleMarkRevised = (subjectId: string, chapterId: string, topicId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    const topic = chapter?.topics.find((t) => t.id === topicId);
    if (!subject || !chapter || !topic) return;

    // Validation: only allow revision for completed/revised topics
    if (topic.status !== 'completed' && topic.status !== 'revised') {
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: 'Complete this topic in Subjects first!', type: 'error' } })
      );
      return;
    }

    markTopicRevised(subjectId, chapterId, topicId);
    addActivity({
      type: 'topic-revised',
      description: `Revised "${topic.name}" (×${topic.revisionCount + 1})`,
      subjectId,
      color: subject.color,
    });
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `"${topic.name}" revised! (×${topic.revisionCount + 1})`, type: 'success' } })
    );
  };

  const handleReviseAllInChapter = (subjectId: string, chapterId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    if (!subject || !chapter) return;

    let count = 0;
    chapter.topics.forEach((topic) => {
      // Only revise completed/revised topics
      if (topic.status === 'completed' || topic.status === 'revised') {
        markTopicRevised(subjectId, chapterId, topic.id);
        count++;
      }
    });

    if (count > 0) {
      addActivity({
        type: 'topic-revised',
        description: `Revised ${count} topics in "${chapter.name}"`,
        subjectId,
        color: subject.color,
      });
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: `${count} topics revised in "${chapter.name}"!`, type: 'success' } })
      );
    }
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[hsl(var(--muted-foreground))] animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Revisions"
        description="Repetition is the mother of learning — each revision makes you stronger! 🧠"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Topics"
          value={stats.totalTopics}
          icon={BookOpen}
          color="#6366f1"
          subtitle={`${stats.completedTopics} completed`}
        />
        <StatCard
          title="Revised"
          value={stats.revisedAtLeastOnce}
          icon={RotateCcw}
          color="#8b5cf6"
          subtitle={`of ${stats.totalTopics} topics`}
        />
        <StatCard
          title="Total Revisions"
          value={stats.totalRevisionCount}
          icon={TrendingUp}
          color="#22c55e"
          subtitle="Across all topics"
        />
        <StatCard
          title="Coverage"
          value={`${stats.totalTopics > 0 ? Math.round((stats.revisedAtLeastOnce / stats.totalTopics) * 100) : 0}%`}
          icon={Target}
          color="#f97316"
          subtitle="Topics revised at least once"
        />
      </div>

      {/* Completion analysis */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <CompletionAnalysis subjects={subjects} />
        </div>
      )}

      {/* Full Curriculum */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
            Add subjects in the Subjects page. Complete topics there, then come here to track revisions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Subjects ({subjects.length})
            </h2>
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked topics need completion in Subjects first
            </p>
          </div>
          {subjects.map((subject) => (
            <SubjectCurriculum
              key={subject.id}
              subject={subject}
              onMarkRevised={(chapterId, topicId) => handleMarkRevised(subject.id, chapterId, topicId)}
              onReviseAllInChapter={(chapterId) => handleReviseAllInChapter(subject.id, chapterId)}
            />
          ))}
        </div>
      )}
    </>
  );
}
