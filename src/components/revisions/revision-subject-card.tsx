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
  PenTool,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
// Props
// ---------------------------------------------------------------------------
interface RevisionSubjectCardProps {
  subject: Subject;
  index: number;
}

// ---------------------------------------------------------------------------
// RevisionSubjectCard
// ---------------------------------------------------------------------------
export function RevisionSubjectCard({
  subject,
  index,
}: RevisionSubjectCardProps) {
  const Icon = getIcon(subject.icon);

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
    const revisionPercent =
      totalTopics > 0 ? Math.round((revisedCount / totalTopics) * 100) : 0;

    return { totalTopics, completed, revised: revisedCount, revisionPercent };
  }, [subject.chapters]);

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
          <Link
            href={`/revisions/${subject.id}`}
            className="flex items-start justify-between w-full text-left gap-2 mb-3 outline-none"
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
                <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-[hsl(var(--primary))] transition-colors">
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
              <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </div>
          </Link>

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

        </div>
      </div>
    </motion.div>
  );
}
