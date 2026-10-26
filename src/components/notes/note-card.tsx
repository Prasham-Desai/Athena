'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Image as ImageIcon,
  BookOpen,
  Tag,
  Edit3,
  Trash2,
  Clock,
  ArrowUpRight,
  FolderOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { NoteDocument, Subject, Chapter, Topic } from '@/types';

interface NoteCardProps {
  note: NoteDocument;
  subject?: Subject | null;
  chapter?: Chapter | null;
  topic?: Topic | null;
  viewMode?: 'grid' | 'list';
  showSubjectPill?: boolean;
  onOpen: (note: NoteDocument) => void;
  onEdit: (note: NoteDocument, e: React.MouseEvent) => void;
  onDelete: (note: NoteDocument, e: React.MouseEvent) => void;
}

export function NoteCard({
  note,
  subject,
  chapter,
  topic,
  viewMode = 'grid',
  showSubjectPill = true,
  onOpen,
  onEdit,
  onDelete,
}: NoteCardProps) {
  const isPdf = note.file_type === 'pdf';
  const formattedDate = format(new Date(note.created_at), 'MMM d, yyyy');
  const formattedSize =
    note.file_size > 1024 * 1024
      ? `${(note.file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(note.file_size / 1024)} KB`;

  const subjectColor = subject?.color || '#6366f1';

  // ── List View Layout ───────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        whileHover={{ x: 2 }}
        onClick={() => onOpen(note)}
        className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-indigo-500/50 rounded-2xl p-3.5 sm:px-5 sm:py-3.5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden"
      >
        {/* Left accent bar on hover */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
          style={{ backgroundColor: subjectColor }}
        />

        {/* Info Column */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 pl-1">
          {/* Format Icon */}
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
              isPdf
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            )}
          >
            {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-400 transition-colors truncate">
                {note.title}
              </h3>

              {showSubjectPill && subject && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border truncate"
                  style={{
                    backgroundColor: `${subjectColor}15`,
                    borderColor: `${subjectColor}30`,
                    color: subjectColor,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectColor }} />
                  <span className="truncate max-w-[120px]">{subject.name}</span>
                </span>
              )}
            </div>

            {note.subtitle && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mb-1">
                {note.subtitle}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap text-[10px] text-[hsl(var(--muted-foreground))]">
              {chapter && (
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-400">
                  <BookOpen className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[160px]">{chapter.name}</span>
                </span>
              )}
              {chapter && topic && <span>•</span>}
              {topic && (
                <span className="inline-flex items-center gap-1 font-semibold text-violet-400">
                  <Tag className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[140px]">{topic.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta & Actions Column */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[hsl(var(--border))]">
          <div className="text-right text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
            <div>
              {note.page_count} {note.page_count === 1 ? 'page' : 'pages'} • {formattedSize}
            </div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]/70 font-sans">
              {formattedDate}
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onOpen(note)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition"
              title="Open Document & Annotations"
            >
              <span>Open</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onEdit(note, e)}
              className="p-1.5 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
              title="Edit Details & Curriculum Linking"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onDelete(note, e)}
              className="p-1.5 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-rose-500 hover:bg-rose-500/10 transition"
              title="Delete Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Grid View Layout ───────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      onClick={() => onOpen(note)}
      className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top hairline colored by subject */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
        style={{ backgroundColor: subjectColor }}
      />

      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3 mt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Format Badge */}
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider',
                isPdf
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              )}
            >
              {isPdf ? 'PDF' : note.file_type}
            </span>

            {/* Subject Pill (if in All view) */}
            {showSubjectPill && subject && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border truncate max-w-[130px]"
                style={{
                  backgroundColor: `${subjectColor}15`,
                  borderColor: `${subjectColor}30`,
                  color: subjectColor,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectColor }} />
                <span className="truncate">{subject.name}</span>
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] shrink-0">
            {formattedSize} • {note.page_count}p
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
          {note.title}
        </h3>
        {note.subtitle && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3 leading-relaxed">
            {note.subtitle}
          </p>
        )}

        {/* Linked Chapter & Topic Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {chapter ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 max-w-[200px] truncate">
              <BookOpen className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{chapter.name}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]">
              <FolderOpen className="w-2.5 h-2.5" />
              <span>General Subject Note</span>
            </span>
          )}

          {topic && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 max-w-[160px] truncate">
              <Tag className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{topic.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
        <span className="inline-flex items-center gap-1 text-[11px]">
          <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]/70" />
          <span>{formattedDate}</span>
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onOpen(note)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-semibold border border-indigo-500/20 transition"
            title="Open Document & Annotations"
          >
            <span>Read</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => onEdit(note, e)}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition"
            title="Edit Details & Linked Chapter"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(note, e)}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-rose-500 hover:bg-rose-500/10 transition"
            title="Delete Document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
