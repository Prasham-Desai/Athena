'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Pencil,
  Trash2,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Layers,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn, isOverdue, isToday } from '@/lib/utils';
import { getSubjectDisplayName } from '@/lib/subject-display';
import { revisionSubjectHref, subjectDetailHref } from '@/lib/routes';
import type { Subject } from '@/types';

// ---------------------------------------------------------------------------
// Icon Map
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
// Types & Props
// ---------------------------------------------------------------------------
export type SubjectCardVariant = 'subjects' | 'revisions' | 'notes';

export interface SubjectCardNoteStats {
  total: number;
  pdfs: number;
  images: number;
}

export interface UniversalSubjectCardProps {
  subject: Subject;
  index?: number;
  variant?: SubjectCardVariant;
  // For 'subjects' variant
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  // For 'notes' variant
  noteStats?: SubjectCardNoteStats;
  onSelect?: (id: string) => void;
  // Optional custom classes
  className?: string;
}

// ---------------------------------------------------------------------------
// Central Unified Subject Card
// ---------------------------------------------------------------------------
export function SubjectCard({
  subject,
  index = 0,
  variant = 'subjects',
  onEdit,
  onDelete,
  noteStats = { total: 0, pdfs: 0, images: 0 },
  onSelect,
  className,
}: UniversalSubjectCardProps) {
  const Icon = getIcon(subject.icon);
  const color = subject.color || '#6366f1';
  const displayName = getSubjectDisplayName(subject);
  const chaptersCount = subject.chapters?.length || 0;

  // ── Calculated Curriculum & Revision Statistics ──────────────────────────
  const stats = useMemo(() => {
    let totalTopics = 0;
    let completed = 0;
    let inProgress = 0;
    let revised = 0;
    let dueRevisions = 0;

    for (const ch of subject.chapters || []) {
      for (const t of ch.topics || []) {
        totalTopics++;
        if (t.status === 'completed') completed++;
        if (t.status === 'in-progress') inProgress++;
        if (t.status === 'revised') {
          completed++;
          revised++;
        } else if (t.revisionCount > 0) {
          revised++;
        }

        const isRevisable = t.status === 'completed' || t.status === 'revised';
        if (isRevisable && t.nextRevisionDue) {
          if (isOverdue(t.nextRevisionDue) || isToday(t.nextRevisionDue)) {
            dueRevisions++;
          }
        }
      }
    }

    const syllabusPercent =
      totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;
    const revisionPercent =
      totalTopics > 0 ? Math.round((revised / totalTopics) * 100) : 0;
    const remaining = totalTopics - completed;

    return {
      totalTopics,
      completed,
      inProgress,
      revised,
      dueRevisions,
      syllabusPercent,
      revisionPercent,
      remaining,
    };
  }, [subject.chapters]);

  // Determine destination URL
  const href =
    variant === 'subjects'
      ? subjectDetailHref(subject.id)
      : variant === 'revisions'
      ? revisionSubjectHref(subject.id)
      : undefined;

  // Click handler when not using a direct <Link>
  const handleCardClick = () => {
    if (variant === 'notes' && onSelect) {
      onSelect(subject.id);
    }
  };

  // ── Card Content ─────────────────────────────────────────────────────────
  const cardContent = (
    <div
      className={cn(
        'group relative flex flex-col justify-between h-full rounded-2xl',
        'border border-[hsl(var(--border))]/80 bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card))]/90',
        'dark:from-[#0d1222]/95 dark:to-[#090d18]/95',
        'shadow-sm hover:shadow-xl transition-all duration-300',
        'hover:-translate-y-1 overflow-hidden select-none cursor-pointer',
        className
      )}
      style={{
        // Dynamic border highlight on hover via CSS custom property
        ['--subject-color' as any]: color,
      }}
      onClick={handleCardClick}
    >
      {/* ── Top Ambient Light Glow Strip ─────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300 group-hover:h-[3.5px]"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}aa 70%, transparent 100%)`,
        }}
      />

      {/* ── Corner Radial Aura ───────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />

      {/* ── CARD BODY ────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        {/* ── 1. Header Row: Icon, Title & Context Controls ──────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Glowing Icon Squircle */}
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105 border"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}35`,
                color: color,
                boxShadow: `0 8px 16px -4px ${color}25`,
              }}
            >
              <Icon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-3" />
            </div>

            {/* Name + Chapter Pill */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${color}12`,
                    borderColor: `${color}28`,
                    color: color,
                  }}
                >
                  {chaptersCount} {chaptersCount === 1 ? 'Chapter' : 'Chapters'}
                </span>
              </div>
              <h3 className="break-words text-base font-bold leading-snug text-[hsl(var(--foreground))] transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400 [overflow-wrap:anywhere]">
                {displayName}
              </h3>
            </div>
          </div>

          {/* Right Action / Status Badge */}
          <div className="flex items-center gap-1 shrink-0">
            {variant === 'subjects' && (
              <div className="flex items-center gap-0.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(subject.id);
                    }}
                    aria-label={`Edit ${displayName}`}
                    className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(subject.id);
                    }}
                    aria-label={`Delete ${displayName}`}
                    className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {variant === 'revisions' && (
              <>
                {stats.dueRevisions > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm animate-pulse">
                    <RotateCcw className="w-3 h-3" />
                    <span>{stats.dueRevisions} Due</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Up to date</span>
                  </span>
                )}
              </>
            )}

            {variant === 'notes' && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}30`,
                  color: color,
                }}
              >
                <FileText className="w-3 h-3" />
                <span>
                  {noteStats.total} {noteStats.total === 1 ? 'doc' : 'docs'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* ── 2. Stat Pods Grid (3 Modern Metric Pods) ────────────────────── */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[hsl(var(--muted))]/50 dark:bg-white/[0.02] border border-[hsl(var(--border))]/70 p-2.5 sm:p-3">
          {variant === 'subjects' && (
            <>
              {/* Pod 1: Topics */}
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Topics
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                  {stats.totalTopics}
                </p>
              </div>

              {/* Pod 2: Completed */}
              <div className="text-left border-l border-[hsl(var(--border))]/50 pl-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Completed
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                  {stats.completed}
                  <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                    /{stats.totalTopics}
                  </span>
                </p>
              </div>

              {/* Pod 3: Revisions Due */}
              <div className="text-left border-l border-[hsl(var(--border))]/50 pl-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Revisions
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-base font-bold tabular-nums',
                    stats.dueRevisions > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[hsl(var(--foreground))]'
                  )}
                >
                  {stats.dueRevisions}
                  <span className="text-xs font-normal text-[hsl(var(--muted-foreground))] ml-1">
                    due
                  </span>
                </p>
              </div>
            </>
          )}

          {variant === 'revisions' && (
            <>
              {/* Pod 1: Total Topics */}
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Total
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                  {stats.totalTopics}
                  <span className="text-[10px] font-normal text-[hsl(var(--muted-foreground))] ml-1">
                    topics
                  </span>
                </p>
              </div>

              {/* Pod 2: Revised */}
              <div className="text-left border-l border-[hsl(var(--border))]/50 pl-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Revised
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-violet-600 dark:text-violet-400">
                  {stats.revised}
                  <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                    /{stats.totalTopics}
                  </span>
                </p>
              </div>

              {/* Pod 3: Due Now */}
              <div className="text-left border-l border-[hsl(var(--border))]/50 pl-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Due Now
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-base font-bold tabular-nums',
                    stats.dueRevisions > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {stats.dueRevisions}
                </p>
              </div>
            </>
          )}

          {variant === 'notes' && (
            <>
              {/* Pod 1: All Documents */}
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Total
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                  {noteStats.total}
                  <span className="text-[10px] font-normal text-[hsl(var(--muted-foreground))] ml-1">
                    files
                  </span>
                </p>
              </div>

              {/* Pod 2: PDFs */}
              <div className="text-left border-l border-[hsl(var(--border))]/50 pl-2.5">
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <FileText className="w-3 h-3" />
                  <span>PDFs</span>
                </div>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                  {noteStats.pdfs}
                </p>
              </div>

              {/* Pod 3: Images */}
              <div className="text-left border-l border-[hsl(var(--border))]/50 pl-2.5">
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <ImageIcon className="w-3 h-3" />
                  <span>Images</span>
                </div>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                  {noteStats.images}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── 3. Progress / Ratio Bar Section ──────────────────────────────── */}
        <div className="space-y-1.5">
          {variant === 'subjects' && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                  Syllabus Progress
                </span>
                <span className="font-bold tabular-nums text-xs" style={{ color }}>
                  {stats.syllabusPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]/70 relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}90`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.syllabusPercent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.04 }}
                />
              </div>
            </>
          )}

          {variant === 'revisions' && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                  Revision Coverage
                </span>
                <span className="font-bold tabular-nums text-xs" style={{ color }}>
                  {stats.revisionPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]/70 relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}90`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.revisionPercent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.04 }}
                />
              </div>
            </>
          )}

          {variant === 'notes' && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                  Document Distribution
                </span>
                <span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">
                  {noteStats.total === 0
                    ? 'Empty'
                    : `${noteStats.pdfs} PDF · ${noteStats.images} Img`}
                </span>
              </div>
              {/* Multi-segment distribution bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]/70 flex">
                {noteStats.total > 0 ? (
                  <>
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{
                        width: `${(noteStats.pdfs / noteStats.total) * 100}%`,
                      }}
                      title={`${noteStats.pdfs} PDFs`}
                    />
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(noteStats.images / noteStats.total) * 100}%`,
                      }}
                      title={`${noteStats.images} Images`}
                    />
                  </>
                ) : (
                  <div className="h-full w-full bg-[hsl(var(--muted))]" />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 4. Card Footer Row ───────────────────────────────────────────── */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[hsl(var(--border))]/70 bg-[hsl(var(--muted))]/30 dark:bg-white/[0.015] flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
          {variant === 'subjects' && (
            <>
              {stats.inProgress > 0
                ? `${stats.inProgress} in progress`
                : stats.remaining === 0
                ? 'All topics complete 🎉'
                : `${stats.remaining} remaining`}
            </>
          )}
          {variant === 'revisions' && (
            <>
              {stats.dueRevisions > 0
                ? `${stats.dueRevisions} topics need review`
                : 'All scheduled revisions done'}
            </>
          )}
          {variant === 'notes' && (
            <>
              {noteStats.total === 0
                ? 'No notes yet'
                : `${noteStats.total} documents available`}
            </>
          )}
        </span>

        {/* Action text + Animated Arrow */}
        <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
          <span>
            {variant === 'subjects'
              ? 'Open subject'
              : variant === 'revisions'
              ? 'Start revision'
              : 'Open workspace'}
          </span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );

  // ── Motion Wrapper & Link Resolution ─────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }}
      layout
      className="h-full"
    >
      {href ? (
        <Link
          href={href}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </motion.div>
  );
}

export default SubjectCard;
