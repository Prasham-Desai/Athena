'use client';

import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  Search,
  X,
  BookOpen,
  Tag,
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
  type LucideIcon,
} from 'lucide-react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useResolvedSubject } from '@/hooks/use-resolved-subject';
import { getSubjectDisplayName, getSubjectEnglishTitle } from '@/lib/subject-display';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoader } from '@/components/ui/loading';
import { cn, IMPORTANCE_TAG_CONFIG, isOverdue, isToday } from '@/lib/utils';
import type { Topic, Chapter } from '@/types';

// ---------------------------------------------------------------------------
// Icon map
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

function getIcon(name: string | undefined): LucideIcon {
  if (!name) return BookOpen;
  return ICON_MAP[name] ?? BookOpen;
}

// ---------------------------------------------------------------------------
// Topic filter pill config
// ---------------------------------------------------------------------------
type TopicFilter = 'all' | 'due' | 'revised' | 'not-revised';

const TOPIC_FILTER_OPTIONS: {
  value: TopicFilter;
  label: string;
  countKey: 'all' | 'due' | 'revised' | 'notRevised';
}[] = [
  { value: 'all', label: 'All', countKey: 'all' },
  { value: 'due', label: 'Due for Revision', countKey: 'due' },
  { value: 'revised', label: 'Revised', countKey: 'revised' },
  { value: 'not-revised', label: 'Not Revised', countKey: 'notRevised' },
];

// ---------------------------------------------------------------------------
// Revision Icon Group
// ---------------------------------------------------------------------------
interface RevisionIconGroupProps {
  revisionCount: number;
  onRevisionChange: (newCount: number) => void;
  size?: 'sm' | 'md';
  subjectColor: string;
  subjectIcon?: string;
}

function RevisionIconGroup({
  revisionCount,
  onRevisionChange,
  size = 'md',
  subjectColor,
  subjectIcon,
}: RevisionIconGroupProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const [hoverEmpty, setHoverEmpty] = useState(false);
  
  const Icon = getIcon(subjectIcon);

  const icons = [];
  for (let i = 0; i < revisionCount; i++) {
    icons.push(
      <button
        key={`filled-${i}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRevisionChange(i);
        }}
        className="shrink-0 outline-none hover:scale-110 transition-transform"
        aria-label={`Unmark revision ${i + 1}`}
      >
        <Icon 
          className={cn(iconSize, 'transition-all drop-shadow-md')} 
          style={{ color: subjectColor, fill: subjectColor }} 
        />
      </button>
    );
  }

  // The next empty icon to click
  icons.push(
    <button
      key={`empty-${revisionCount}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRevisionChange(revisionCount + 1);
      }}
      onMouseEnter={() => setHoverEmpty(true)}
      onMouseLeave={() => setHoverEmpty(false)}
      className="shrink-0 outline-none hover:scale-110 transition-transform"
      aria-label={`Mark revision ${revisionCount + 1}`}
    >
      <Icon 
        className={cn(iconSize, 'transition-colors')} 
        style={{ 
          color: hoverEmpty ? subjectColor : 'hsl(var(--muted-foreground))',
          fill: hoverEmpty ? `${subjectColor}40` : 'none'
        }}
      />
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">{icons}</div>
      {revisionCount > 0 && (
        <span 
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
            size === 'sm' && "text-[9px] px-1 py-px"
          )}
          style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
        >
          {revisionCount} {revisionCount === 1 ? 'rev' : 'revs'}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topic Row
// ---------------------------------------------------------------------------
interface TopicRowProps {
  topic: Topic;
  subjectId: string;
  chapterId: string;
  subjectColor: string;
  subjectIcon: string;
}

function TopicRow({ topic, subjectId, chapterId, subjectColor, subjectIcon }: TopicRowProps) {
  const setTopicRevisionCount = useSubjectsStore((s) => s.setTopicRevisionCount);
  const setSubtopicRevisionCount = useSubjectsStore((s) => s.setSubtopicRevisionCount);

  const [hoverTopic, setHoverTopic] = useState(false);

  const isRevisable = topic.status === 'completed' || topic.status === 'revised';

  return (
    <div className={cn('space-y-1', !isRevisable && 'opacity-60 grayscale-[30%]')}>
      {/* Main Topic Row */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-2 rounded-xl transition-all',
          'hover:bg-[hsl(var(--muted))]/50 group'
        )}
        onMouseEnter={() => setHoverTopic(true)}
        onMouseLeave={() => setHoverTopic(false)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium transition-colors break-words"
              style={{ color: hoverTopic ? subjectColor : 'inherit' }}
            >
              {topic.name}
            </span>
            {!isRevisable && (
              <span className="text-[10px] italic text-[hsl(var(--muted-foreground))] shrink-0">
                (Complete in Subjects first)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Importance Tag */}
          {topic.importance && IMPORTANCE_TAG_CONFIG[topic.importance] && (
            <div
              className={cn(
                'shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                IMPORTANCE_TAG_CONFIG[topic.importance].bg,
                IMPORTANCE_TAG_CONFIG[topic.importance].text,
                IMPORTANCE_TAG_CONFIG[topic.importance].border
              )}
            >
              <Tag className="w-3 h-3" />
              <span className="hidden sm:inline">{IMPORTANCE_TAG_CONFIG[topic.importance].label}</span>
            </div>
          )}

          <RevisionIconGroup
            revisionCount={topic.revisionCount}
            onRevisionChange={(count) => {
              if (isRevisable || count === 0) {
                setTopicRevisionCount(subjectId, chapterId, topic.id, count);
              }
            }}
            subjectColor={subjectColor}
            subjectIcon={subjectIcon}
          />
        </div>
      </div>

      {/* Subtopics */}
      {topic.subtopics && topic.subtopics.length > 0 && (
        <div className="pl-4 space-y-1 mt-1">
          {topic.subtopics.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]/30 transition-colors"
            >
              <span className="flex-1 min-w-0 text-xs text-[hsl(var(--muted-foreground))] truncate">
                {sub.name}
              </span>
              <RevisionIconGroup
                size="sm"
                revisionCount={sub.revisionCount || 0}
                onRevisionChange={(count) => {
                  if (isRevisable || count === 0) {
                    setSubtopicRevisionCount(subjectId, chapterId, topic.id, sub.id, count);
                  }
                }}
                subjectColor={subjectColor}
                subjectIcon={subjectIcon}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter Accordion
// ---------------------------------------------------------------------------
interface ChapterAccordionProps {
  chapter: Chapter;
  subjectId: string;
  defaultOpen?: boolean;
  subjectColor: string;
  subjectIcon: string;
}

function ChapterAccordion({ chapter, subjectId, defaultOpen = false, subjectColor, subjectIcon }: ChapterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const setChapterRevisionCount = useSubjectsStore((s) => s.setChapterRevisionCount);

  const chapterRevisionCount = useMemo(() => {
    if (chapter.topics.length === 0) return 0;
    return Math.min(...chapter.topics.map((t) => t.revisionCount || 0));
  }, [chapter.topics]);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-[hsl(var(--muted))]/30 transition-colors">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 flex flex-col items-start text-left"
        >
          <h3 className="font-semibold text-sm sm:text-base break-words">{chapter.name}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {chapter.topics.length} topic{chapter.topics.length === 1 ? '' : 's'}
          </p>
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
          <RevisionIconGroup
            revisionCount={chapterRevisionCount}
            onRevisionChange={(count) => {
              setChapterRevisionCount(subjectId, chapter.id, count);
            }}
            subjectColor={subjectColor}
            subjectIcon={subjectIcon}
          />
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 rounded-lg hover:bg-[hsl(var(--muted))] transition text-[hsl(var(--muted-foreground))]"
            aria-label={isOpen ? "Collapse chapter" : "Expand chapter"}
          >
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
              <ChevronDown className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden border-t border-[hsl(var(--border))]"
          >
            <div className="p-3 sm:p-4 space-y-2">
              {chapter.topics.length === 0 ? (
                <div className="text-center py-4 text-xs text-[hsl(var(--muted-foreground))]">
                  No topics matching the current filter.
                </div>
              ) : (
                chapter.topics.map((topic) => (
                  <TopicRow key={topic.id} topic={topic} subjectId={subjectId} chapterId={chapter.id} subjectColor={subjectColor} subjectIcon={subjectIcon} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function RevisionSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydration();
  
  const { subject, isResolving: subjectResolving } = useResolvedSubject(id, hydrated);

  const HeaderIcon = getIcon(subject?.icon);

  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('all');

  // Paper bifurcation (matching /subjects/[id])
  const availablePapers = useMemo(() => {
    if (!subject) return ['Paper 1'];
    const papers = new Set(subject.chapters.map((c) => c.paper || 'Paper 1'));
    return Array.from(papers).sort();
  }, [subject]);

  const [activePaper, setActivePaper] = useState<string>('Paper 1');
  const currentPaper = availablePapers.includes(activePaper) ? activePaper : (availablePapers[0] || 'Paper 1');

  // Chapters belonging to the selected paper
  const paperChapters = useMemo(() => {
    if (!subject) return [];
    return subject.chapters.filter((c) => (c.paper || 'Paper 1') === currentPaper);
  }, [subject, currentPaper]);

  // Topic filter counts for the current paper
  const filterCounts = useMemo(() => {
    let all = 0, due = 0, revised = 0, notRevised = 0;
    paperChapters.forEach((ch) => {
      ch.topics.forEach((t) => {
        all++;
        const isRevisable = t.status === 'completed' || t.status === 'revised';
        if (isRevisable) {
          const hasRevisions = (t.revisionCount || 0) > 0;
          const isTopicDue = t.nextRevisionDue && (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue));
          if (isTopicDue) due++;
          if (hasRevisions) revised++;
          if (!hasRevisions) notRevised++;
        } else {
          notRevised++;
        }
      });
    });
    return { all, due, revised, notRevised };
  }, [paperChapters]);

  // Filtered chapters & topics based on paper, search, and topic filter
  const filteredChapters = useMemo(() => {
    if (!paperChapters.length) return [];
    const query = searchQuery.trim().toLowerCase();

    return paperChapters.map((ch) => {
      const filteredTopics = ch.topics.filter((t) => {
        // Topic status filter
        if (topicFilter === 'due') {
          const isRevisable = t.status === 'completed' || t.status === 'revised';
          if (!isRevisable || !t.nextRevisionDue || (!isOverdue(t.nextRevisionDue) && !isToday(t.nextRevisionDue))) {
            return false;
          }
        } else if (topicFilter === 'revised') {
          if (!t.revisionCount || t.revisionCount === 0) return false;
        } else if (topicFilter === 'not-revised') {
          if (t.revisionCount && t.revisionCount > 0) return false;
        }

        // Search query check
        if (query) {
          const matchesName = t.name.toLowerCase().includes(query);
          const matchesSub = t.subtopics?.some((sub) => sub.name.toLowerCase().includes(query));
          return matchesName || matchesSub;
        }

        return true;
      });

      // If search matches chapter name, include all topics that match the status filter
      if (query && ch.name.toLowerCase().includes(query)) {
        const topicsMatchingFilter = ch.topics.filter((t) => {
          if (topicFilter === 'due') {
            const isRevisable = t.status === 'completed' || t.status === 'revised';
            return isRevisable && t.nextRevisionDue && (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue));
          } else if (topicFilter === 'revised') {
            return (t.revisionCount || 0) > 0;
          } else if (topicFilter === 'not-revised') {
            return !t.revisionCount || t.revisionCount === 0;
          }
          return true;
        });

        if (topicsMatchingFilter.length > 0) {
          return { ...ch, topics: topicsMatchingFilter };
        }
      }

      if (filteredTopics.length > 0) {
        return { ...ch, topics: filteredTopics };
      }

      return null;
    }).filter(Boolean) as Chapter[];
  }, [paperChapters, searchQuery, topicFilter]);

  if (!hydrated || subjectResolving) {
    return <PageLoader label="Loading revision details" variant="detail" />;
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h2 className="text-xl font-bold">Subject not found</h2>
        <Link
          href="/revisions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 hover:border-indigo-400 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Revisions
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 sm:pb-12">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ backgroundColor: subject.color }}
            >
              <HeaderIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex min-w-0 flex-col break-words [overflow-wrap:anywhere]">
              <span className="text-[hsl(var(--muted-foreground))] text-xs sm:text-sm font-medium -mb-0.5">Revise</span>
              <span style={{ color: subject.color }}>{getSubjectDisplayName(subject)}</span>
              {getSubjectEnglishTitle(subject) && <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">{getSubjectEnglishTitle(subject)}</span>}
            </div>
          </div>
        }
        description="Track your multiple revisions for each topic and subtopic."
      >
        {/* Prominent, visually highlighted Back button */}
        <Link
          href="/revisions"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 hover:bg-indigo-500/25 hover:border-indigo-400 hover:text-indigo-300 transition-all shadow-sm hover:shadow-indigo-500/10 group shrink-0"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Revisions</span>
        </Link>
      </PageHeader>

      {/* Paper Tabs — Paper-wise bifurcation following subjects page convention */}
      {availablePapers.length > 1 && (
        <LayoutGroup id="revision-paper-tabs">
          <div className="w-full overflow-x-auto pb-1 mb-4">
            <div role="group" aria-label="Subject papers" className="inline-flex max-w-full items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shrink-0">
              {availablePapers.map((paper) => (
                <button
                  key={paper}
                  onClick={() => setActivePaper(paper)}
                  type="button"
                  aria-pressed={currentPaper === paper}
                  className={cn(
                    'relative whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] shrink-0 cursor-pointer',
                    currentPaper === paper
                      ? 'text-white'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-foreground hover:bg-[hsl(var(--accent))]'
                  )}
                >
                  {currentPaper === paper && (
                    <motion.div
                      layoutId="revisionPaperTab"
                      className="absolute inset-0 rounded-xl gpu-smooth"
                      style={{ backgroundColor: subject.color, willChange: 'transform' }}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{paper}</span>
                </button>
              ))}
            </div>
          </div>
        </LayoutGroup>
      )}

      {/* Search & Topic Status Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search topics */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder={`Search ${availablePapers.length > 1 ? `${currentPaper} ` : ''}topics or subtopics...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Topic Filter Pills — Moved here from the subject selection page */}
        <LayoutGroup id="revision-topic-filter-tabs">
          <div
            className={cn(
              'flex gap-1.5 sm:flex-wrap w-full sm:w-auto relative items-center p-1 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]',
              'flex-nowrap overflow-x-auto pb-1 sm:pb-1 sm:overflow-x-visible',
              '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
            )}
          >
            {TOPIC_FILTER_OPTIONS.map((opt) => {
              const isActive = topicFilter === opt.value;
              const count = filterCounts[opt.countKey];

              return (
                <button
                  key={opt.value}
                  onClick={() => setTopicFilter(opt.value)}
                  className={cn(
                    'relative flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'text-white'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="revision-topic-filter-active-pill"
                      className="absolute inset-0 rounded-lg shadow-sm gpu-smooth"
                      style={{ backgroundColor: subject.color || 'hsl(var(--primary))', willChange: 'transform' }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                  <span
                    className={cn(
                      'relative z-10 ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 rounded-full text-[0.625rem] font-semibold transition-colors duration-150',
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* Chapters & Topics List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPaper}-${topicFilter}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="space-y-4 gpu-smooth"
        >
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))]/50">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="font-semibold mb-1">No topics found</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {searchQuery || topicFilter !== 'all'
                  ? 'Try adjusting your search query or topic filter.'
                  : `No chapters or topics found in ${currentPaper}.`}
              </p>
              {(searchQuery || topicFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTopicFilter('all');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            filteredChapters.map((chapter) => (
              <ChapterAccordion
                key={chapter.id}
                chapter={chapter}
                subjectId={subject.id}
                subjectColor={subject.color}
                subjectIcon={subject.icon}
                defaultOpen={filteredChapters.length === 1 || searchQuery.length > 0 || topicFilter !== 'all'}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
