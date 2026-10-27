'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  CheckCircle2,
  Circle,
  Pencil,
  Search,
  RotateCcw,
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
  Headphones,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  type LucideIcon,
  FileText,
} from 'lucide-react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useResolvedSubject } from '@/hooks/use-resolved-subject';
import { getSubjectDisplayName, getSubjectEnglishTitle } from '@/lib/subject-display';
import { subjectNotesHref } from '@/lib/routes';
import { useActivityStore } from '@/store/activity-store';
import { useAudioStore } from '@/store/audio-store';
import { useHydration } from '@/hooks/use-hydration';
import { ProgressRing } from '@/components/shared/progress-ring';
import { PageLoader } from '@/components/ui/loading';
import { AudioRecorder } from '@/components/shared/audio-recorder';
import { AudioAutoplayBar } from '@/components/shared/audio-autoplay-bar';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn, STATUS_CONFIG, getToday } from '@/lib/utils';
import type { TopicStatus, Topic, Chapter } from '@/types';

// ---------------------------------------------------------------------------
// Notes parser – extracts sub-sub-topics and metadata from topic.notes
// ---------------------------------------------------------------------------
interface ParsedNotes {
  subSubTopics: string[];
  metadata: { key: string; value: string }[];
}

function parseTopicNotes(notes: string | undefined | null): ParsedNotes {
  if (!notes) return { subSubTopics: [], metadata: [] };

  const subSubTopics: string[] = [];
  const metadata: { key: string; value: string }[] = [];

  const lines = notes.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Metadata lines: **Key:** Value
    const metaMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.+)$/);
    if (metaMatch) {
      metadata.push({ key: metaMatch[1].trim(), value: metaMatch[2].trim() });
      continue;
    }

    // Sub-sub-topic bullet lines: * Item
    const bulletMatch = trimmed.match(/^\*\s+(.+)$/);
    if (bulletMatch) {
      subSubTopics.push(bulletMatch[1].trim());
      continue;
    }
  }

  return { subSubTopics, metadata };
}

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, Calculator, Atom, Globe, Code, Palette,
  Music, FlaskConical, Scale, Languages, Brain, Lightbulb,
  GraduationCap, Microscope, Compass, PenTool,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? BookOpen;
}

type RevisionFilter = 'all' | 'scheduled' | 'due' | 'not-scheduled';

function matchesTopicFilters(topic: Topic, chapterName: string, query: string, statusFilter: TopicStatus | 'all', importanceFilter: string, revisionFilter: RevisionFilter, today: string) {
  const search = query.trim().toLowerCase();
  const searchMatches = !search || chapterName.toLowerCase().includes(search) || topic.name.toLowerCase().includes(search) || topic.subtopics?.some((sub: { name: string }) => sub.name.toLowerCase().includes(search)) || topic.notes?.toLowerCase().includes(search);
  const statusMatches = statusFilter === 'all' || topic.status === statusFilter;
  const importanceMatches = importanceFilter === 'all' || (importanceFilter === 'not-specified' ? !topic.importance || topic.importance === 'Not Specified' : topic.importance === importanceFilter);
  const hasRevisionSchedule = (topic.status === 'completed' || topic.status === 'revised') && Boolean(topic.nextRevisionDue);
  const revisionDue = hasRevisionSchedule && (topic.nextRevisionDue || '') <= today;
  const revisionMatches = revisionFilter === 'all' || (revisionFilter === 'scheduled' && hasRevisionSchedule) || (revisionFilter === 'due' && revisionDue) || (revisionFilter === 'not-scheduled' && !hasRevisionSchedule);
  return Boolean(searchMatches && statusMatches && importanceMatches && revisionMatches);
}

// ---------------------------------------------------------------------------
// Inline Editable Text
// ---------------------------------------------------------------------------
interface InlineEditProps {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  inputClassName?: string;
}

function InlineEdit({ value, onSave, className, inputClassName }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          'bg-transparent border-b-2 border-[hsl(var(--ring))] outline-none text-sm px-0 py-0.5',
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
      className={cn('group/edit inline-flex items-start gap-1.5 text-left', className)}
    >
      <span className={cn('break-words leading-snug', inputClassName?.includes('w-full') && 'w-full')}>{value}</span>
      <Pencil className="w-3 h-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0 mt-0.5" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status badge + dropdown
// ---------------------------------------------------------------------------
interface StatusSelectProps {
  status: TopicStatus;
  onChange: (s: TopicStatus) => void;
}

function StatusSelect({ status, onChange }: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = STATUS_CONFIG[status];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
          config.bg, config.text
        )}
      >
        {config.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="menu"
            aria-label="Topic status"
            className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl overflow-hidden"
          >
            {(Object.keys(STATUS_CONFIG) as TopicStatus[]).map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onChange(s); setOpen(false); }}
                  role="menuitemradio"
                  aria-checked={s === status}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition-colors',
                    s === status && 'bg-[hsl(var(--muted))]'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.label}
                  {s === status && <Check className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Importance Select dropdown
// ---------------------------------------------------------------------------
const IMPORTANCE_OPTIONS = [
  { value: 'Must Know', label: 'Must Know', bg: 'bg-red-500/10', text: 'text-red-500', color: 'rgb(239, 68, 68)' },
  { value: 'Required to Know', label: 'Required to Know', bg: 'bg-orange-500/10', text: 'text-orange-500', color: 'rgb(249, 115, 22)' },
  { value: 'Desirable to Know', label: 'Desirable to Know', bg: 'bg-amber-500/10', text: 'text-amber-500', color: 'rgb(245, 158, 11)' },
  { value: 'Nice to Know', label: 'Nice to Know', bg: 'bg-violet-500/10', text: 'text-violet-500', color: 'rgb(139, 92, 246)' },
  { value: 'Not Specified', label: 'Not Specified', bg: 'bg-blue-500/10', text: 'text-blue-500', color: 'rgb(59, 130, 246)' },
];

function ImportanceSelect({ importance, onChange }: { importance?: string | null; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const current = IMPORTANCE_OPTIONS.find(o => o.value === importance) || IMPORTANCE_OPTIONS[4];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
          current.bg, current.text
        )}
      >
        {current.label}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="menu"
            aria-label="Topic importance"
            className="absolute left-0 top-full mt-1 z-20 min-w-[150px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl overflow-hidden"
          >
            {IMPORTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                role="menuitemradio"
                aria-checked={opt.value === current.value}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition-colors',
                  opt.value === current.value && 'bg-[hsl(var(--muted))]'
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                {opt.label}
                {opt.value === current.value && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
  isVisible?: boolean;
  onPlayGlobal?: (topicId: string, audioId?: string) => void;
}

function TopicRow({ topic, subjectId, chapterId, subjectColor, isVisible = true, onPlayGlobal }: TopicRowProps) {
  const updateTopic = useSubjectsStore((s) => s.updateTopic);
  const setTopicStatus = useSubjectsStore((s) => s.setTopicStatus);
  const markTopicRevised = useSubjectsStore((s) => s.markTopicRevised);
  const deleteTopic = useSubjectsStore((s) => s.deleteTopic);
  const addActivity = useActivityStore((s) => s.addActivity);
  const subjects = useSubjectsStore((s) => s.subjects);
  const audioNotes = useAudioStore((s) => s.audioNotes[topic.id]) || [];
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasAudio = audioNotes.length > 0;

  const subjectName = (() => {
    const currentSubject = subjects.find((s) => s.id === subjectId);
    return currentSubject ? getSubjectDisplayName(currentSubject) : '';
  })();
  const isCompleted = topic.status === 'completed' || topic.status === 'revised';

  const handleToggleComplete = () => {
    if (isCompleted) {
      setTopicStatus(subjectId, chapterId, topic.id, 'not-started');
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: `"${topic.name}" unmarked`, type: 'info' } })
      );
    } else {
      setTopicStatus(subjectId, chapterId, topic.id, 'completed');
      addActivity({
        type: 'topic-completed',
        description: `Completed "${topic.name}" in ${subjectName}`,
        subjectId,
        color: subjectColor,
      });
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: `"${topic.name}" completed!`, type: 'success' } })
      );
    }
  };

  const handleStatusChange = (newStatus: TopicStatus) => {
    setTopicStatus(subjectId, chapterId, topic.id, newStatus);
    if (newStatus === 'completed') {
      addActivity({
        type: 'topic-completed',
        description: `Completed "${topic.name}" in ${subjectName}`,
        subjectId,
        color: subjectColor,
      });
    }
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `Status updated to "${STATUS_CONFIG[newStatus].label}"`, type: 'success' } })
    );
  };

  const handleRevise = () => {
    markTopicRevised(subjectId, chapterId, topic.id);
    addActivity({
      type: 'topic-revised',
      description: `Revised "${topic.name}" in ${subjectName} (×${topic.revisionCount + 1})`,
      subjectId,
      color: subjectColor,
    });
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `"${topic.name}" marked as revised!`, type: 'success' } })
    );
  };

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const executeDelete = () => {
    deleteTopic(subjectId, chapterId, topic.id);
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `Topic "${topic.name}" deleted.`, type: 'success' } })
    );
  };

  const parsedNotes = parseTopicNotes(topic.notes);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
      className={cn(
        'group rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 hover:shadow-sm transition-all',
        !isVisible && 'hidden',
        isCompleted
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-[hsl(var(--background))] border-[hsl(var(--border))]'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
          {/* Completion checkbox */}
        <button
          type="button"
          onClick={handleToggleComplete}
          className="shrink-0 transition-transform hover:scale-110 mt-0.5"
          aria-label={isCompleted ? `Unmark ${topic.name} as complete` : `Mark ${topic.name} as complete`}
          aria-pressed={isCompleted}
          title={isCompleted ? 'Unmark completed' : 'Mark as completed'}
        >
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </motion.div>
          ) : (
            <Circle className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full">
              <InlineEdit
                value={topic.name}
                onSave={(v) => updateTopic(subjectId, chapterId, topic.id, { name: v })}
                className={cn('text-sm font-medium min-w-0 flex-1')}
                inputClassName="w-full"
              />
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <AudioRecorder topicId={topic.id} topicName={topic.name} compact={true} onPlayGlobal={onPlayGlobal ? (audioId?: string) => onPlayGlobal(topic.id, audioId) : undefined} />
                {/* Importance */}
                <ImportanceSelect
                  importance={topic.importance}
                  onChange={(v) => updateTopic(subjectId, chapterId, topic.id, { importance: v })}
                />
                {/* Revision count */}
                {topic.revisionCount > 0 && (
                  <span className="text-[11px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full shrink-0">
                    ×{topic.revisionCount}
                  </span>
                )}
              </div>
          </div>
          
          {/* Subtopics (Checkpoints) */}
          {topic.subtopics && topic.subtopics.length > 0 && (
            <div className="mt-3 pl-4 ml-2 pb-2 border-l-2 border-[hsl(var(--border))]/50">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Topics</p>
            <ul className="space-y-2">
              {topic.subtopics.map((sub: any) => {
                const isSubCompleted = sub.status === 'completed';
                const subImportance = IMPORTANCE_OPTIONS.find((option) => option.value === sub.importance) || IMPORTANCE_OPTIONS[4];
                return (
                  <li key={sub.id} className="flex items-start gap-2.5 group/sub">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useSubjectsStore.getState().setSubtopicStatus(
                          subjectId,
                          chapterId,
                          topic.id,
                          sub.id,
                          isSubCompleted ? 'not-started' : 'completed'
                        );
                      }}
                      className="shrink-0 mt-0.5 transition-transform hover:scale-110"
                    >
                      {isSubCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-[hsl(var(--muted-foreground))] hover:text-emerald-500 transition-colors" />
                      )}
                    </button>
                    <span className={cn(
                      "text-sm break-words leading-snug flex-1 min-w-0 mt-0.5",
                      isSubCompleted ? "text-[hsl(var(--muted-foreground))] line-through" : "text-[hsl(var(--foreground))]"
                    )}>
                      {sub.name}
                    </span>
                    <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold', subImportance.bg, subImportance.text)}>{subImportance.label}</span>
                  </li>
                );
              })}
            </ul>
            </div>
          )}

          {/* Sub-sub-topics from notes */}
          {parsedNotes.subSubTopics.length > 0 && (
            <div className="sub-subtopic-section">
              {parsedNotes.subSubTopics.map((item, idx) => (
                <div key={idx} className="sub-subtopic-item">
                  <span className="sub-subtopic-marker" />
                  <span className="sub-subtopic-name">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Metadata from notes (Expected Marks, Weightage, etc.) */}
          {parsedNotes.metadata.length > 0 && (
            <div className="topic-metadata">
              {parsedNotes.metadata.map((meta, idx) => (
                <span key={idx} className="topic-meta-tag">
                  <span className="topic-meta-key">{meta.key}:</span>
                  <span className="topic-meta-value">{meta.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end border-t sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0 border-[hsl(var(--border))]/50">
        {/* Status selector */}
          <StatusSelect status={topic.status} onChange={handleStatusChange} />

          {/* Revise button */}
          {isCompleted && (
            <button
              type="button"
              onClick={handleRevise}
              aria-label={`Record a revision for ${topic.name}`}
              className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-500/10 transition-colors shrink-0"
              title="Mark as revised"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Audio Indicator */}
          {hasAudio && (
            <div
              className="p-1.5 rounded-lg text-indigo-500 bg-indigo-500/10 shrink-0 flex items-center justify-center"
              title="This topic has audio notes"
            >
              <Headphones className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete topic ${topic.name}`}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-all shrink-0"
            title="Delete topic"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={executeDelete}
        title="Delete Topic"
        message={`Are you sure you want to delete "${topic.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chapter Accordion
// ---------------------------------------------------------------------------
interface ChapterAccordionProps {
  chapter: Chapter;
  subjectId: string;
  subjectColor: string;
  defaultOpen?: boolean;
  searchQuery?: string;
  statusFilter?: TopicStatus | 'all';
  importanceFilter?: string;
  revisionFilter?: RevisionFilter;
  hasTopicFilters?: boolean;
  isVisible?: boolean;
  onPlayAll?: (playlist: any[], startIndex?: number) => void;
}

function ChapterAccordion({ chapter, subjectId, subjectColor, defaultOpen = false, searchQuery = '', statusFilter = 'all', importanceFilter = 'all', revisionFilter = 'all', hasTopicFilters = false, isVisible = true, onPlayAll }: ChapterAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = open;
  const [newTopicName, setNewTopicName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if ((searchQuery || hasTopicFilters) && isVisible) setOpen(true);
  }, [searchQuery, hasTopicFilters, isVisible]);

  const updateChapter = useSubjectsStore((s) => s.updateChapter);
  const deleteChapter = useSubjectsStore((s) => s.deleteChapter);
  const addTopic = useSubjectsStore((s) => s.addTopic);
  const setAllChapterTopicsStatus = useSubjectsStore((s) => s.setAllChapterTopicsStatus);
  const setChapterTag = useSubjectsStore((s) => s.setChapterTag);
  const addActivity = useActivityStore((s) => s.addActivity);
  const subjects = useSubjectsStore((s) => s.subjects);
  const subjectName = (() => {
    const currentSubject = subjects.find((s) => s.id === subjectId);
    return currentSubject ? getSubjectDisplayName(currentSubject) : '';
  })();

  const fetchAudioNotesForChapter = useAudioStore((s) => s.fetchAudioNotesForChapter);
  const audioNotes = useAudioStore((s) => s.audioNotes);

  useEffect(() => {
    fetchAudioNotesForChapter(chapter.id);
  }, [chapter.id, fetchAudioNotesForChapter]);

  const playlist = useMemo(() => {
    if (!chapter.topics) return [];
    
    const list: any[] = [];
    chapter.topics.forEach((t: Topic) => {
      const notes = audioNotes[t.id];
      if (notes && notes.length > 0) {
        notes.forEach((note: any, index: number) => {
          list.push({
            topicId: t.id,
            topicName: `${t.name} (Part ${index + 1})`,
            noteId: note.id,
            duration: note.duration_seconds || 0
          });
        });
      }
    });
    return list;
  }, [chapter.topics, audioNotes]);

  const handlePlayGlobal = useCallback((topicId: string, audioId?: string) => {
    let startIndex = playlist.findIndex((p: any) => p.topicId === topicId);
    if (audioId) {
      startIndex = playlist.findIndex((p: any) => p.noteId === audioId);
    }
    if (startIndex >= 0 && onPlayAll) {
      onPlayAll(playlist, startIndex);
    }
  }, [playlist, onPlayAll]);

  const [showTagPicker, setShowTagPicker] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);
  
  const [showMarksPicker, setShowMarksPicker] = useState(false);
  const marksRef = useRef<HTMLDivElement>(null);
  const [draftMarks, setDraftMarks] = useState('');

  const chapterTag = chapter.tag;
  const estimatedMarks = chapter.estimatedMarks;

  // Close tag picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setShowTagPicker(false);
      if (marksRef.current && !marksRef.current.contains(e.target as Node)) setShowMarksPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const chapterStats = useMemo(() => {
    const total = chapter.topics.length;
    const done = chapter.topics.filter((t) => t.status === 'completed' || t.status === 'revised').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const allDone = total > 0 && done === total;
    return { total, done, percent, allDone };
  }, [chapter.topics]);

  const displayedTopics = useMemo(() => {
    const today = getToday();
    return chapter.topics.filter((topic) => matchesTopicFilters(topic, chapter.name, searchQuery, statusFilter, importanceFilter, revisionFilter, today));
  }, [chapter.topics, chapter.name, searchQuery, statusFilter, importanceFilter, revisionFilter]);

  const handleToggleChapter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (chapter.topics.length === 0) return;

    if (chapterStats.allDone) {
      // Uncheck all — back to not-started
      setAllChapterTopicsStatus(subjectId, chapter.id, 'not-started');
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: `All topics in "${chapter.name}" unmarked`, type: 'info' } })
      );
    } else {
      // Check all — mark as completed
      setAllChapterTopicsStatus(subjectId, chapter.id, 'completed');
      addActivity({
        type: 'topic-completed',
        description: `Completed all topics in "${chapter.name}" (${subjectName})`,
        subjectId,
        color: subjectColor,
        count: chapter.topics.length,
      });
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: `All ${chapter.topics.length} topics in "${chapter.name}" completed! 🎉`, type: 'success' } })
      );
    }
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    addTopic(subjectId, chapter.id, trimmed);
    setNewTopicName('');
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `Topic "${trimmed}" added!`, type: 'success' } })
    );
  };

  const handleDeleteChapter = () => {
    setConfirmDelete(true);
  };

  const executeDeleteChapter = () => {
    deleteChapter(subjectId, chapter.id);
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `Chapter "${chapter.name}" deleted.`, type: 'success' } })
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={cn('rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]', !isVisible && 'hidden')}
    >
      {/* Chapter header */}
      <div className={cn('group flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4', chapterStats.allDone && 'bg-emerald-500/5')}>
        <button type="button" onClick={() => setOpen(!isOpen)} aria-expanded={isOpen} aria-controls={`chapter-content-${chapter.id}`} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${chapter.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex"><ChevronDown className="h-4 w-4" /></motion.span>
        </button>

        {/* Chapter completion checkbox */}
        <button
          type="button"
          onClick={handleToggleChapter}
          className="shrink-0 transition-transform hover:scale-110"
          aria-label={chapterStats.allDone ? `Unmark all topics in ${chapter.name}` : `Complete all topics in ${chapter.name}`}
          title={chapterStats.allDone ? 'Uncheck all topics' : 'Mark all topics as completed'}
        >
          {chapterStats.allDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : chapterStats.done > 0 ? (
            <div className="relative w-5 h-5">
              <Circle className="w-5 h-5 text-emerald-500/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[8px] font-bold text-emerald-500">{chapterStats.done}</span>
              </div>
            </div>
          ) : (
            <Circle className="w-5 h-5 text-[hsl(var(--muted-foreground))] hover:text-emerald-500 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 w-full">
            <InlineEdit
              value={chapter.name}
              onSave={(v) => updateChapter(subjectId, chapter.id, { name: v })}
              className="text-sm font-semibold w-full"
              inputClassName="w-full"
            />
          </div>
          <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
            {chapterStats.done}/{chapterStats.total} topics · {chapterStats.percent}%
          </p>
        </div>
        {/* Mini progress bar */}
        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[hsl(var(--muted))] sm:block" aria-label={`${chapterStats.percent}% complete`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${chapterStats.percent}%`, backgroundColor: subjectColor }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Play All Audio */}
          {playlist.length > 0 && (
            <button
              type="button"
              onClick={() => onPlayAll?.(playlist)}
              className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              aria-label={`Play all ${playlist.length} audio notes in ${chapter.name}`}
              title={`Play all ${playlist.length} audio notes in this chapter`}
            >
              <Headphones className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteChapter}
            aria-label={`Delete ${chapter.name}`}
            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-all hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`chapter-content-${chapter.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-5 pb-4 sm:pb-5 pt-3 pl-3 sm:pl-11 space-y-2">
              {/* Topic list */}
              <AnimatePresence mode="popLayout">
                {chapter.topics.map((topic) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    subjectId={subjectId}
                    chapterId={chapter.id}
                    subjectColor={subjectColor}
                    isVisible={displayedTopics.some((displayed) => displayed.id === topic.id)}
                    onPlayGlobal={handlePlayGlobal}
                  />
                ))}
              </AnimatePresence>


              {displayedTopics.length === 0 && !searchQuery && !hasTopicFilters && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">
                  No topics yet. Add one below.
                </p>
              )}

              {/* Add topic form */}
              <form onSubmit={handleAddTopic} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Add a topic…"
                  className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition"
                />
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="p-2 rounded-xl text-white transition disabled:opacity-40"
                  style={{ backgroundColor: subjectColor }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={executeDeleteChapter}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${chapter.name}"? All topics inside it will be deleted. This action cannot be undone.`}
        confirmText="Delete"
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Subject Detail Page
// ---------------------------------------------------------------------------
export default function SubjectDetailPage() {
  const hydrated = useHydration();
  const params = useParams();
  const id = params.id as string;

  const subjects = useSubjectsStore((s) => s.subjects);
  const subjectsLoading = useSubjectsStore((s) => s.isLoading);
  const { subject, isResolving: subjectResolving } = useResolvedSubject(id, hydrated);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
  const [importanceFilter, setImportanceFilter] = useState('all');
  const [revisionFilter, setRevisionFilter] = useState<RevisionFilter>('all');
  const [chapterSort, setChapterSort] = useState<'custom' | 'name' | 'progress'>('custom');
  
  const [activePlaylist, setActivePlaylist] = useState<any[]>([]);
  const [autoplayActive, setAutoplayActive] = useState(false);
  const [autoplayStartIndex, setAutoplayStartIndex] = useState(0);

  const handlePlayAll = useCallback((playlist: any[], startIndex = 0) => {
    setActivePlaylist(playlist);
    setAutoplayStartIndex(startIndex);
    setAutoplayActive(true);
  }, []);

  const availablePapers = useMemo(() => {
    if (!subject) return ["Paper 1"];
    const papers = new Set(subject.chapters.map(c => c.paper || "Paper 1"));
    return Array.from(papers).sort();
  }, [subject]);

  const [activePaper, setActivePaper] = useState<string>("Paper 1");
  const currentPaper = availablePapers.includes(activePaper) ? activePaper : (availablePapers[0] || 'Paper 1');

  const stats = useMemo(() => {
    if (!subject) return { total: 0, completed: 0, revised: 0, inProgress: 0, done: 0, percent: 0 };
    let total = 0, completed = 0, revised = 0, inProgress = 0;
    for (const ch of subject.chapters) {
      if ((ch.paper || "Paper 1") !== currentPaper) continue;
      for (const t of ch.topics) {
        total++;
        if (t.status === 'completed') completed++;
        if (t.status === 'revised') revised++;
        if (t.status === 'in-progress') inProgress++;
      }
    }
    const done = completed + revised;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, completed, revised, inProgress, done, percent };
  }, [subject, currentPaper]);

  const overallStats = useMemo(() => {
    if (!subject) return { chapters: 0, total: 0, done: 0, completed: 0, revised: 0, inProgress: 0, revisions: 0, dueRevisions: 0, percent: 0 };
    let total = 0, completed = 0, revised = 0, inProgress = 0, revisions = 0, dueRevisions = 0;
    const today = getToday();
    for (const chapter of subject.chapters) for (const topic of chapter.topics) {
      total++;
      if (topic.status === 'completed') completed++;
      if (topic.status === 'revised') revised++;
      if (topic.status === 'in-progress') inProgress++;
      revisions += topic.revisionCount || 0;
      if ((topic.status === 'completed' || topic.status === 'revised') && topic.nextRevisionDue && topic.nextRevisionDue <= today) dueRevisions++;
    }
    const done = completed + revised;
    return { chapters: subject.chapters.length, total, done, completed, revised, inProgress, revisions, dueRevisions, percent: total ? Math.round(done / total * 100) : 0 };
  }, [subject]);

  const filteredChapters = useMemo(() => {
    const chapters = subject?.chapters.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => (chapter.paper || 'Paper 1') === currentPaper) || [];
    if (chapterSort === 'name') chapters.sort((a, b) => a.chapter.name.localeCompare(b.chapter.name));
    if (chapterSort === 'progress') chapters.sort((a, b) => {
      const percent = (chapter: Chapter) => chapter.topics.length ? chapter.topics.filter((topic) => topic.status === 'completed' || topic.status === 'revised').length / chapter.topics.length : 0;
      return percent(b.chapter) - percent(a.chapter) || a.index - b.index;
    });
    return chapters.map(({ chapter }) => chapter);
  }, [subject, currentPaper, chapterSort]);
  const hasTopicFilters = statusFilter !== 'all' || importanceFilter !== 'all' || revisionFilter !== 'all';
  const hasActiveFilters = Boolean(searchQuery.trim()) || hasTopicFilters;
  const matchingChapterIds = useMemo(() => new Set(filteredChapters.filter((chapter) =>
    !hasActiveFilters || chapter.topics.some((topic) => matchesTopicFilters(topic, chapter.name, searchQuery, statusFilter, importanceFilter, revisionFilter, getToday()))
  ).map((chapter) => chapter.id)), [filteredChapters, hasActiveFilters, searchQuery, statusFilter, importanceFilter, revisionFilter]);

  // ---------- Loading ----------
  if (!hydrated) {
    return <PageLoader label="Loading subject details" variant="detail" />;
  }

  if (subjectResolving) {
    return <PageLoader label="Loading subject details" variant="detail" />;
  }

  // ---------- Not Found ----------
  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Subject not found</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          This subject may have been deleted.
        </p>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subjects
        </Link>
      </div>
    );
  }

  const Icon = getIcon(subject.icon);
  const subjectYearId = subject.academicYearId || subject.academic_year_id;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/subjects" aria-label="Back to subjects" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${subject.color}20`, color: subject.color }}><Icon className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl [overflow-wrap:anywhere]">{getSubjectDisplayName(subject)}</h1>
              {getSubjectEnglishTitle(subject) && <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))] [overflow-wrap:anywhere]">{getSubjectEnglishTitle(subject)}</p>}
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{overallStats.chapters} chapters · {overallStats.total} topics across this subject</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Link href={subjectNotesHref(subject.id, subjectYearId)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 text-xs font-medium text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"><FileText className="h-3.5 w-3.5" />Subject notes</Link>
            <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--background))] px-3 py-2">
              <div className="text-right"><p className="text-lg font-semibold tabular-nums">{overallStats.percent}%</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">complete</p></div>
              <ProgressRing value={overallStats.percent} size={42} strokeWidth={4} color={subject.color} />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[hsl(var(--border))] pt-3 sm:grid-cols-4">
          <div><p className="text-sm font-semibold tabular-nums">{overallStats.done}<span className="font-normal text-[hsl(var(--muted-foreground))]">/{overallStats.total}</span></p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">Topics complete</p></div>
          <div><p className="text-sm font-semibold tabular-nums">{overallStats.chapters}</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">Chapters</p></div>
          <div><p className="text-sm font-semibold tabular-nums">{overallStats.revised}</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">Topics revised</p></div>
          <div><p className="text-sm font-semibold tabular-nums">{overallStats.dueRevisions}<span className="ml-1 text-[10px] font-normal text-[hsl(var(--muted-foreground))]">due</span></p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">Revision queue · {overallStats.revisions} logged</p></div>
        </div>
      </section>

      {/* Paper Tabs */}
      {availablePapers.length > 1 && (
        <LayoutGroup id="subject-paper-tabs">
          <div role="group" aria-label="Subject papers" className="inline-flex max-w-full items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
            {availablePapers.map((paper) => (
              <button
                key={paper}
                onClick={() => setActivePaper(paper)}
                type="button"
                aria-pressed={currentPaper === paper}
                className={cn(
                  'relative rounded-lg px-4 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                  currentPaper === paper
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-foreground hover:bg-[hsl(var(--accent))]'
                )}
              >
                {currentPaper === paper && (
                  <motion.div
                    layoutId="paperTab"
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: subject.color }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                  />
                )}
                <span className="relative z-10">{paper}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      )}

      <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 sm:p-4" aria-label="Chapter and topic tools">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(130px,1fr))]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <span className="sr-only">Search chapters and topics</span>
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search ${currentPaper} chapters and topics`} className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3"><SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" /><span className="sr-only">Filter topic status</span><select aria-label="Filter topic status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TopicStatus | 'all')} className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"><option value="all">All statuses</option>{(Object.keys(STATUS_CONFIG) as TopicStatus[]).map((status) => <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>)}</select></label>
          <label className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" /><span className="sr-only">Filter topic importance</span><select aria-label="Filter topic importance" value={importanceFilter} onChange={(event) => setImportanceFilter(event.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"><option value="all">All importance</option><option>Must Know</option><option>Required to Know</option><option>Desirable to Know</option><option>Nice to Know</option><option value="not-specified">Not Specified</option></select></label>
          <label className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3"><RotateCcw className="h-3.5 w-3.5 shrink-0 text-purple-300" /><span className="sr-only">Filter revision state</span><select aria-label="Filter revision state" value={revisionFilter} onChange={(event) => setRevisionFilter(event.target.value as RevisionFilter)} className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"><option value="all">All revisions</option><option value="due">Due now</option><option value="scheduled">Scheduled</option><option value="not-scheduled">No schedule</option></select></label>
          <label className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3"><ArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" /><span className="sr-only">Sort chapters</span><select aria-label="Sort chapters" value={chapterSort} onChange={(event) => setChapterSort(event.target.value as typeof chapterSort)} className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"><option value="custom">Original order</option><option value="name">Name A–Z</option><option value="progress">Completion</option></select></label>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>{filteredChapters.length} chapters in {currentPaper}</span>
          <span>{stats.done}/{stats.total} topics complete in {currentPaper} ({stats.percent}%)</span>
        </div>
      </section>

      {/* Chapters list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredChapters.length === 0 || (hasActiveFilters && matchingChapterIds.size === 0) ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="font-semibold mb-1">{searchQuery || hasTopicFilters ? 'No matching chapters or topics' : `No chapters yet in ${currentPaper}`}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {searchQuery || hasTopicFilters ? 'Try adjusting the search or clearing one of the filters.' : 'Add your first chapter to start organising topics.'}
              </p>
            </motion.div>
          ) : (
            filteredChapters.map((ch, idx) => (
              <ChapterAccordion
                key={ch.id}
                chapter={ch}
                subjectId={subject.id}
                subjectColor={subject.color}
                defaultOpen={idx === 0 && (!hasActiveFilters || matchingChapterIds.has(ch.id))}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                importanceFilter={importanceFilter}
                revisionFilter={revisionFilter}
                hasTopicFilters={hasTopicFilters}
                isVisible={matchingChapterIds.has(ch.id)}
                onPlayAll={handlePlayAll}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <AudioAutoplayBar
        playlist={activePlaylist}
        isActive={autoplayActive}
        onClose={() => setAutoplayActive(false)}
        startIndex={autoplayStartIndex}
      />
    </div>
  );
}
