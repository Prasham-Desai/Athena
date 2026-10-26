'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  ArrowUpRight,
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
import type { Subject } from '@/types';

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

interface SubjectNotesCardProps {
  subject: Subject;
  stats: { total: number; pdfs: number; images: number };
  onSelect: (subjectId: string) => void;
}

export function SubjectNotesCard({
  subject,
  stats,
  onSelect,
}: SubjectNotesCardProps) {
  const Icon = getIcon(subject.icon);
  const chaptersCount = subject.chapters?.length || 0;
  const color = subject.color || '#6366f1';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(subject.id)}
      className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Top colored highlight line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
        style={{ backgroundColor: color }}
      />

      {/* Header row */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 mt-0.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0"
              style={{ backgroundColor: color }}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}30`,
                  color: color,
                }}
              >
                {chaptersCount} {chaptersCount === 1 ? 'Chapter' : 'Chapters'}
              </span>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-indigo-400 transition-colors truncate">
                {subject.name}
              </h3>
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--muted))] group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-[hsl(var(--muted-foreground))] transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Breakdown chips */}
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>{stats.pdfs} PDFs</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{stats.images} Images</span>
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3.5 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs">
        <span className="font-semibold text-[hsl(var(--muted-foreground))]">
          {stats.total === 0 ? 'No notes yet' : `${stats.total} total documents`}
        </span>
        <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
          <span>Open Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.div>
  );
}
