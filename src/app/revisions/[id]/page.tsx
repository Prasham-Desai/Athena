'use client';

import { useState, useMemo, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  Minus,
  Plus,
  Search,
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
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { cn, IMPORTANCE_TAG_CONFIG } from '@/lib/utils';
import type { Topic, Chapter, Subtopic } from '@/types';

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
          'flex items-center gap-3 p-2 rounded-xl transition-all',
          'hover:bg-[hsl(var(--muted))]/50 group'
        )}
        onMouseEnter={() => setHoverTopic(true)}
        onMouseLeave={() => setHoverTopic(false)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium truncate transition-colors"
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
      <div className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted))]/30 transition-colors">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 flex flex-col items-start text-left"
        >
          <h3 className="font-semibold text-sm sm:text-base">{chapter.name}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {chapter.topics.length} topics
          </p>
        </button>

        <div className="flex items-center gap-4">
          <RevisionIconGroup
            revisionCount={chapterRevisionCount}
            onRevisionChange={(count) => {
              setChapterRevisionCount(subjectId, chapter.id, count);
            }}
            subjectColor={subjectColor}
            subjectIcon={subjectIcon}
          />
          <button onClick={() => setIsOpen((prev) => !prev)}>
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
                  No topics in this chapter yet.
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
  const router = useRouter();
  
  const subjects = useSubjectsStore((s) => s.subjects);
  const subject = subjects.find((s) => s.id === id);

  const HeaderIcon = getIcon(subject?.icon);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapters = useMemo(() => {
    if (!subject) return [];
    if (!searchQuery.trim()) return subject.chapters;

    const query = searchQuery.toLowerCase();
    return subject.chapters.map((ch) => {
      const filteredTopics = ch.topics.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subtopics?.some((sub) => sub.name.toLowerCase().includes(query))
      );
      
      // Include chapter if its name matches or it has matching topics
      if (ch.name.toLowerCase().includes(query) || filteredTopics.length > 0) {
        return { ...ch, topics: filteredTopics.length > 0 ? filteredTopics : ch.topics };
      }
      return null;
    }).filter(Boolean) as Chapter[];
  }, [subject, searchQuery]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
        </div>
        <h2 className="text-xl font-bold">Subject not found</h2>
        <Link href="/revisions" className="text-[hsl(var(--primary))] hover:underline">
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
            <div className="flex flex-col">
              <span className="text-[hsl(var(--muted-foreground))] text-xs sm:text-sm font-medium -mb-0.5">Revise</span>
              <span style={{ color: subject.color }}>{subject.name}</span>
            </div>
          </div>
        }
        description="Track your multiple revisions for each topic and subtopic."
      >
        <Link
          href="/revisions"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
      </PageHeader>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search topics or subtopics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 transition"
        />
      </div>

      <div className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
            </div>
            <h3 className="font-semibold mb-1">No topics found</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          filteredChapters.map((chapter) => (
            <ChapterAccordion
              key={chapter.id}
              chapter={chapter}
              subjectId={subject.id}
              subjectColor={subject.color}
              subjectIcon={subject.icon}
              defaultOpen={filteredChapters.length === 1 || searchQuery.length > 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
