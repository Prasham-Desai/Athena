'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calculator,
  Atom,
  Globe,
  Code,
  Palette,
  Music,
  FlaskConical,
  Scale,
  Languages,
  Brain,
  Lightbulb,
  GraduationCap,
  Microscope,
  Compass,
  PenTool,
  ChevronRight,
  CheckCircle2,
  Lock,
  RotateCcw,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { cn, isOverdue, isToday, IMPORTANCE_TAG_CONFIG } from '@/lib/utils';
import { ProgressRing } from '@/components/shared/progress-ring';
import type { Subject, Chapter, Topic } from '@/types';

// ---------------------------------------------------------------------------
// Icon map – keeps the dynamic look-up type-safe
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Calculator,
  Atom,
  Globe,
  Code,
  Palette,
  Music,
  FlaskConical,
  Scale,
  Languages,
  Brain,
  Lightbulb,
  GraduationCap,
  Microscope,
  Compass,
  PenTool,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? BookOpen;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isRevisable(topic: Topic): boolean {
  return topic.status === 'completed' || topic.status === 'revised';
}

function getRevisionDueStatus(topic: Topic): 'overdue' | 'due-today' | 'revised-today' | null {
  if (topic.lastRevised && isToday(topic.lastRevised)) return 'revised-today';
  if (isOverdue(topic.nextRevisionDue)) return 'overdue';
  if (isToday(topic.nextRevisionDue)) return 'due-today';
  return null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RevisionSubjectCardProps {
  subject: Subject;
  index: number;
  onMarkRevised: (chapterId: string, topicId: string) => void;
  onReviseAllInChapter: (chapterId: string) => void;
  onUndoRevision: (chapterId: string, topicId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  undoableTopics: Set<string>;
}

// ---------------------------------------------------------------------------
// RevisionSubjectCard
// ---------------------------------------------------------------------------
export function RevisionSubjectCard({
  subject,
  index,
  onMarkRevised,
  onReviseAllInChapter,
  onUndoRevision,
  isExpanded,
  onToggleExpand,
  undoableTopics,
}: RevisionSubjectCardProps) {
  const Icon = getIcon(subject.icon);

  // ── Local state for expanded chapters ──────────────────────────────────
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }, []);

  // ── Computed stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalTopics = 0;
    let completed = 0;
    let revised = 0;

    for (const ch of subject.chapters) {
      for (const t of ch.topics) {
        totalTopics++;
        if (t.status === 'completed') completed++;
        if (t.status === 'revised') revised++;
      }
    }

    const revisedCount = revised;
    const revisableCount = completed + revised;
    const revisionPercent =
      totalTopics > 0 ? Math.round((revisedCount / totalTopics) * 100) : 0;

    return { totalTopics, completed, revised: revisedCount, revisableCount, revisionPercent };
  }, [subject.chapters]);

  // ── Chapter-level stats helper ─────────────────────────────────────────
  const getChapterStats = useCallback((chapter: Chapter) => {
    let total = 0;
    let revised = 0;
    let hasRevisable = false;

    for (const t of chapter.topics) {
      total++;
      if (t.status === 'revised') revised++;
      if (isRevisable(t)) hasRevisable = true;
    }

    return { total, revised, hasRevisable };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      layout
    >
      <div
        className={cn(
          'relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden',
          'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
          'transition-all duration-300 hover:-translate-y-0.5'
        )}
      >
        {/* ── Accent top bar ───────────────────────────────────────────── */}
        <div className="h-[1.5px] w-full" style={{ backgroundColor: subject.color }} />

        <div className="p-3 sm:p-4">
          {/* ── Header row (clickable) ───────────────────────────────── */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-start justify-between w-full text-left gap-2 mb-3"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Subject icon */}
              <div
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-white shadow-lg shrink-0"
                style={{ backgroundColor: subject.color }}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Name + subtitle */}
              <div className="min-w-0 pr-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {subject.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] sm:text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 font-medium">
                  <span>{subject.chapters.length} chapters</span>
                  <span>·</span>
                  <span>{stats.totalTopics} topics</span>
                  <span>·</span>
                  <span>{stats.revised} revised</span>
                </div>
              </div>
            </div>

            {/* Right side: ProgressRing + chevron */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block">
                <ProgressRing
                  value={stats.revisionPercent}
                  size={40}
                  strokeWidth={4}
                  color={subject.color}
                />
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </motion.div>
            </div>
          </button>

          {/* ── Topic stats pills ──────────────────────────────────── */}
          {stats.totalTopics > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
              {stats.completed > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-[11px] font-medium">
                  ✓ {stats.completed}
                </span>
              )}
              {stats.revised > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-[10px] sm:text-[11px] font-medium">
                  ↻ {stats.revised}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[10px] sm:text-[11px] font-medium">
                {stats.totalTopics} topics
              </span>
            </div>
          )}

          {/* ── Revision progress bar ──────────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Revision Progress</span>
              <span className="font-semibold" style={{ color: subject.color }}>
                {stats.revisionPercent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: subject.color }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.revisionPercent}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: index * 0.05 + 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* ── Expanded content ─────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[hsl(var(--border))]">
                {subject.chapters.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    No chapters in this subject yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[hsl(var(--border))]">
                    {subject.chapters.map((chapter) => {
                      const chStats = getChapterStats(chapter);
                      const isChapterExpanded = expandedChapters.has(chapter.id);

                      return (
                        <div key={chapter.id}>
                          {/* ── Chapter header ─────────────────────── */}
                          <button
                            type="button"
                            onClick={() => toggleChapter(chapter.id)}
                            className="flex items-center justify-between w-full px-3 sm:px-4 py-2.5 text-left hover:bg-[hsl(var(--muted))]/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <motion.div
                                animate={{ rotate: isChapterExpanded ? 90 : 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="shrink-0"
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                              </motion.div>
                              <span className="text-xs sm:text-sm font-medium truncate">
                                {chapter.name}
                              </span>
                              <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium shrink-0">
                                {chStats.revised}/{chStats.total} revised
                              </span>
                            </div>

                            {/* Revise All button */}
                            {chStats.hasRevisable && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReviseAllInChapter(chapter.id);
                                }}
                                className={cn(
                                  'shrink-0 inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg',
                                  'bg-gradient-to-r from-violet-600 to-purple-600 text-white',
                                  'text-[9px] sm:text-[10px] font-medium',
                                  'shadow-sm shadow-violet-500/20 hover:opacity-90 transition-opacity',
                                  'ml-2'
                                )}
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                Revise All
                              </button>
                            )}
                          </button>

                          {/* ── Chapter topics list ────────────────── */}
                          <AnimatePresence initial={false}>
                            {isChapterExpanded && (
                              <motion.div
                                key={`topics-${chapter.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-2">
                                  {chapter.topics.length === 0 ? (
                                    <div className="px-4 py-3 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
                                      No topics in this chapter.
                                    </div>
                                  ) : (
                                    chapter.topics.map((topic, topicIdx) => {
                                      const revisable = isRevisable(topic);
                                      const dueStatus = getRevisionDueStatus(topic);

                                      return (
                                        <motion.div
                                          key={topic.id}
                                          initial={{ opacity: 0, x: -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: topicIdx * 0.02, type: 'spring', stiffness: 400, damping: 30 }}
                                          className={cn(
                                            'flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2',
                                            'hover:bg-[hsl(var(--muted))]/30 transition-colors',
                                            !revisable && 'opacity-50'
                                          )}
                                        >
                                          {/* Status icon + due dot */}
                                          <div className="relative shrink-0">
                                            {revisable ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                              <Lock className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                                            )}
                                            {/* Smart due-date indicator dot */}
                                            {dueStatus === 'overdue' && (
                                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-[hsl(var(--card))]" />
                                            )}
                                            {dueStatus === 'due-today' && (
                                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-[hsl(var(--card))]" />
                                            )}
                                            {dueStatus === 'revised-today' && (
                                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[hsl(var(--card))]" />
                                            )}
                                          </div>

                                          {/* Topic name */}
                                          <span className="text-xs truncate min-w-0 flex-1">
                                            {topic.name}
                                            {!revisable && (
                                              <span className="italic text-[9px] text-[hsl(var(--muted-foreground))] ml-1.5">
                                                (complete in Subjects first)
                                              </span>
                                            )}
                                          </span>

                                          {/* Badges: importance + revision count */}
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {/* Importance badge */}
                                            {topic.importance && IMPORTANCE_TAG_CONFIG[topic.importance] && (
                                              <span
                                                className={cn(
                                                  'hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold border',
                                                  IMPORTANCE_TAG_CONFIG[topic.importance].bg,
                                                  IMPORTANCE_TAG_CONFIG[topic.importance].text,
                                                  IMPORTANCE_TAG_CONFIG[topic.importance].border
                                                )}
                                              >
                                                {IMPORTANCE_TAG_CONFIG[topic.importance].label}
                                              </span>
                                            )}

                                            {/* Revision count pill */}
                                            {topic.revisionCount > 0 && (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-[9px] sm:text-[10px] font-medium">
                                                ×{topic.revisionCount} revised
                                              </span>
                                            )}

                                            {/* Undo button */}
                                            {undoableTopics.has(topic.id) && (
                                              <button
                                                type="button"
                                                onClick={() => onUndoRevision(chapter.id, topic.id)}
                                                className={cn(
                                                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg',
                                                  'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
                                                  'text-[9px] font-medium transition-colors'
                                                )}
                                                title="Undo revision"
                                              >
                                                <RotateCcw className="w-2.5 h-2.5" />
                                                Undo
                                              </button>
                                            )}

                                            {/* Revise / Revise Again button */}
                                            {revisable && (
                                              <button
                                                type="button"
                                                onClick={() => onMarkRevised(chapter.id, topic.id)}
                                                className={cn(
                                                  'inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg',
                                                  'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
                                                  'text-[9px] sm:text-[10px] font-medium',
                                                  'shadow-sm shadow-indigo-500/20 hover:opacity-90 transition-opacity'
                                                )}
                                              >
                                                {topic.revisionCount > 0 ? 'Revise Again' : 'Revise'}
                                              </button>
                                            )}
                                          </div>
                                        </motion.div>
                                      );
                                    })
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
