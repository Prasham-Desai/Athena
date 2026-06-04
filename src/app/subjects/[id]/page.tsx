'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Target,
  Headphones,
  type LucideIcon,
  Tag,
} from 'lucide-react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useActivityStore } from '@/store/activity-store';
import { useAudioStore } from '@/store/audio-store';
import { useHydration } from '@/hooks/use-hydration';
import { ProgressRing } from '@/components/shared/progress-ring';
import { PageHeader } from '@/components/shared/page-header';
import { AudioRecorder } from '@/components/shared/audio-recorder';
import { AudioAutoplayBar } from '@/components/shared/audio-autoplay-bar';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn, STATUS_CONFIG, IMPORTANCE_TAG_CONFIG } from '@/lib/utils';
import type { TopicStatus, Topic, Chapter, ImportanceTag } from '@/types';

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
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all',
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
            className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl overflow-hidden"
          >
            {(Object.keys(STATUS_CONFIG) as TopicStatus[]).map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); }}
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
  { value: 'Not Specified', label: 'Not Specified', bg: 'bg-blue-500/10', text: 'text-blue-500', color: 'rgb(59, 130, 246)' },
];

function ImportanceSelect({ importance, onChange }: { importance?: string | null; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const current = IMPORTANCE_OPTIONS.find(o => o.value === importance) || IMPORTANCE_OPTIONS[3];

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
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:opacity-80 shrink-0 cursor-pointer',
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
            className="absolute left-0 top-full mt-1 z-20 min-w-[150px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl overflow-hidden"
          >
            {IMPORTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
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
  onPlayGlobal?: (topicId: string, audioId?: string) => void;
}

function TopicRow({ topic, subjectId, chapterId, subjectColor, onPlayGlobal }: TopicRowProps) {
  const updateTopic = useSubjectsStore((s) => s.updateTopic);
  const setTopicStatus = useSubjectsStore((s) => s.setTopicStatus);
  const markTopicRevised = useSubjectsStore((s) => s.markTopicRevised);
  const deleteTopic = useSubjectsStore((s) => s.deleteTopic);
  const addActivity = useActivityStore((s) => s.addActivity);
  const subjects = useSubjectsStore((s) => s.subjects);
  const audioNotes = useAudioStore((s) => s.audioNotes[topic.id] || []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasAudio = audioNotes.length > 0;

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? '';
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
        isCompleted
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-[hsl(var(--background))] border-[hsl(var(--border))]'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
          {/* Completion checkbox */}
        <button
          onClick={handleToggleComplete}
          className="shrink-0 transition-transform hover:scale-110 mt-0.5"
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
          <div className="flex flex-col gap-2 w-full">
              <InlineEdit
                value={topic.name}
                onSave={(v) => updateTopic(subjectId, chapterId, topic.id, { name: v })}
                className={cn('text-sm font-medium w-full')}
                inputClassName="w-full"
              />
              <AudioRecorder topicId={topic.id} topicName={topic.name} compact={true} onPlayGlobal={onPlayGlobal ? (audioId?: string) => onPlayGlobal(topic.id, audioId) : undefined} />
              <div className="flex items-center gap-2 flex-wrap">
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
            <ul className="mt-3 space-y-2 pl-4 border-l-2 border-[hsl(var(--border))]/50 ml-2 pb-2">
              {topic.subtopics.map((sub: any) => {
                const isSubCompleted = sub.status === 'completed';
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
                      "text-sm break-words leading-snug w-full min-w-0 mt-0.5",
                      isSubCompleted ? "text-[hsl(var(--muted-foreground))] line-through" : "text-[hsl(var(--foreground))]"
                    )}>
                      {sub.name}
                    </span>
                  </li>
                );
              })}
            </ul>
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
              onClick={handleRevise}
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
            onClick={handleDelete}
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
  onPlayAll?: (playlist: any[], startIndex?: number) => void;
}

function ChapterAccordion({ chapter, subjectId, subjectColor, defaultOpen = false, searchQuery = '', onPlayAll }: ChapterAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [newTopicName, setNewTopicName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (searchQuery) setOpen(true);
  }, [searchQuery]);

  const updateChapter = useSubjectsStore((s) => s.updateChapter);
  const deleteChapter = useSubjectsStore((s) => s.deleteChapter);
  const addTopic = useSubjectsStore((s) => s.addTopic);
  const setAllChapterTopicsStatus = useSubjectsStore((s) => s.setAllChapterTopicsStatus);
  const setChapterTag = useSubjectsStore((s) => s.setChapterTag);
  const addActivity = useActivityStore((s) => s.addActivity);
  const subjects = useSubjectsStore((s) => s.subjects);
  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? '';

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
    if (!searchQuery) return chapter.topics;
    const q = searchQuery.toLowerCase();
    
    // If chapter name matches search, show all topics
    if (chapter.name.toLowerCase().includes(q)) {
      return chapter.topics;
    }

    return chapter.topics.filter(t => {
      if (t.name.toLowerCase().includes(q)) return true;
      if (t.subtopics?.some((s: any) => s.name.toLowerCase().includes(q))) return true;
      if (t.notes?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [chapter.topics, chapter.name, searchQuery]);

  if (searchQuery && displayedTopics.length === 0) {
    return null;
  }

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
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
    >
      {/* Chapter header */}
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          'group w-full flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-[hsl(var(--muted))]/50 transition-colors cursor-pointer',
          chapterStats.allDone && 'bg-emerald-500/5'
        )}
        role="button"
        tabIndex={0}
      >
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mt-1 sm:mt-0"
        >
          <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </motion.div>

        {/* Chapter completion checkbox */}
        <div
          onClick={handleToggleChapter}
          className="shrink-0 transition-transform hover:scale-110 mt-0.5 sm:mt-0"
          role="button"
          tabIndex={0}
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
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 w-full">
            <InlineEdit
              value={chapter.name}
              onSave={(v) => updateChapter(subjectId, chapter.id, { name: v })}
              className="text-sm font-semibold w-full"
              inputClassName="w-full"
            />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {chapterStats.done}/{chapterStats.total} topics · {chapterStats.percent}%
          </p>
        </div>
        {/* Mini progress bar */}
        <div className="w-20 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden hidden sm:block">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${chapterStats.percent}%`, backgroundColor: subjectColor }}
          />
        </div>

        <div className="flex items-center gap-1 transition-opacity">
          {/* Play All Audio */}
          {playlist.length > 0 && (
            <div
              onClick={(e) => { e.stopPropagation(); onPlayAll?.(playlist); }}
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors shrink-0"
              role="button"
              tabIndex={0}
              title={`Play all ${playlist.length} audio notes in this chapter`}
            >
              <Headphones className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Delete */}
          <div
            onClick={(e) => { e.stopPropagation(); handleDeleteChapter(); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-all"
            role="button"
            tabIndex={0}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-5 pb-4 sm:pb-5 pt-3 pl-3 sm:pl-11 space-y-2">
              {/* Topic list */}
              <AnimatePresence mode="popLayout">
                {displayedTopics.map((topic) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    subjectId={subjectId}
                    chapterId={chapter.id}
                    subjectColor={subjectColor}
                    onPlayGlobal={handlePlayGlobal}
                  />
                ))}
              </AnimatePresence>


              {displayedTopics.length === 0 && (
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
  const router = useRouter();
  const id = params.id as string;

  const subjects = useSubjectsStore((s) => s.subjects);
  const addChapter = useSubjectsStore((s) => s.addChapter);

  const [newChapterName, setNewChapterName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activePlaylist, setActivePlaylist] = useState<any[]>([]);
  const [autoplayActive, setAutoplayActive] = useState(false);
  const [autoplayStartIndex, setAutoplayStartIndex] = useState(0);

  const handlePlayAll = useCallback((playlist: any[], startIndex = 0) => {
    setActivePlaylist(playlist);
    setAutoplayStartIndex(startIndex);
    setAutoplayActive(true);
  }, []);

  const subject = useMemo(() => subjects.find((s) => s.id === id), [subjects, id]);

  const availablePapers = useMemo(() => {
    if (!subject) return ["Paper 1"];
    const papers = new Set(subject.chapters.map(c => c.paper || "Paper 1"));
    return Array.from(papers).sort();
  }, [subject]);

  const [activePaper, setActivePaper] = useState<string>("Paper 1");
  
  // Keep activePaper valid if we switch subjects
  useEffect(() => {
    if (availablePapers.length > 0 && !availablePapers.includes(activePaper)) {
      setActivePaper(availablePapers[0]);
    }
  }, [availablePapers, activePaper]);

  const stats = useMemo(() => {
    if (!subject) return { total: 0, completed: 0, revised: 0, inProgress: 0, percent: 0 };
    let total = 0, completed = 0, revised = 0, inProgress = 0;
    for (const ch of subject.chapters) {
      if ((ch.paper || "Paper 1") !== activePaper) continue;
      for (const t of ch.topics) {
        total++;
        if (t.status === 'completed') completed++;
        if (t.status === 'revised') revised++;
        if (t.status === 'in-progress') inProgress++;
      }
    }
    const done = completed + revised;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, completed, revised, inProgress, percent };
  }, [subject, activePaper]);

  const handleAddChapter = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newChapterName.trim();
      if (!trimmed) return;
      addChapter(id, trimmed, activePaper);
      setNewChapterName('');
      window.dispatchEvent(
        new CustomEvent('add-toast', { detail: { message: `Chapter "${trimmed}" added to ${activePaper}!`, type: 'success' } })
      );
    },
    [newChapterName, addChapter, id, activePaper]
  );

  const filteredChapters = useMemo(() => {
    return subject?.chapters.filter(ch => (ch.paper || "Paper 1") === activePaper) || [];
  }, [subject, activePaper]);

  // ---------- Loading ----------
  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-24 rounded-lg bg-[hsl(var(--muted))] animate-pulse" />
        <div className="h-40 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
      </div>
    );
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

  return (
    <div className="space-y-8">
      {/* Back button + header */}
      <PageHeader title={subject.name}>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </PageHeader>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
      >
        {/* Gradient top */}
        <div className="h-2" style={{ backgroundColor: subject.color }} />

        <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
          {/* Icon + info */}
          <div className="flex items-center gap-4 flex-1">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: subject.color }}
            >
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{subject.name}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {subject.chapters.length} chapters · {stats.total} topics
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
              <Check className="w-3 h-3" /> {stats.completed} completed
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium">
              <RotateCcw className="w-3 h-3" /> {stats.revised} revised
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
              ◐ {stats.inProgress} in progress
            </span>
          </div>

          {/* Progress ring */}
          <ProgressRing
            value={stats.percent}
            size={80}
            strokeWidth={6}
            color={subject.color}
            sublabel="complete"
          />
        </div>
      </motion.div>

      {/* Paper Tabs */}
      {availablePapers.length > 1 && (
        <div className="flex items-center gap-2 p-1.5 bg-[hsl(var(--muted))] rounded-2xl w-fit">
          {availablePapers.map((paper) => (
            <button
              key={paper}
              onClick={() => setActivePaper(paper)}
              className={cn(
                'relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
                activePaper === paper
                  ? 'text-white shadow-md'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-foreground hover:bg-[hsl(var(--accent))]'
              )}
            >
              {activePaper === paper && (
                <motion.div
                  layoutId="paperTab"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: subject.color }}
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{paper}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search in ${activePaper}...`}
          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition shadow-sm"
        />
      </div>

      {/* Add chapter form */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleAddChapter}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <input
          type="text"
          value={newChapterName}
          onChange={(e) => setNewChapterName(e.target.value)}
          placeholder={`New chapter for ${activePaper}…`}
          className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition"
        />
        <button
          type="submit"
          disabled={!newChapterName.trim()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white transition disabled:opacity-40 shadow-lg"
          style={{ backgroundColor: subject.color }}
        >
          <Plus className="w-4 h-4" />
          Add Chapter
        </button>
      </motion.form>

      {/* Chapters list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredChapters.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="font-semibold mb-1">No chapters yet in {activePaper}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Add your first chapter to start organising topics.
              </p>
            </motion.div>
          ) : (
            filteredChapters.map((ch, idx) => (
              <ChapterAccordion
                key={ch.id}
                chapter={ch}
                subjectId={subject.id}
                subjectColor={subject.color}
                defaultOpen={idx === 0}
                searchQuery={searchQuery}
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
