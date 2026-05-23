'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  X,
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
  FolderOpen,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, SUBJECT_COLORS, SUBJECT_ICONS } from '@/lib/utils';

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
// Add-Subject Dialog
// ---------------------------------------------------------------------------
interface AddSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string, icon: string) => void;
}

function AddSubjectDialog({ open, onClose, onAdd }: AddSubjectDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color, icon);
    setName('');
    setColor(SUBJECT_COLORS[0]);
    setIcon(SUBJECT_ICONS[0]);
    onClose();
  };

  if (!open) return null;

  const IconPreview = getIcon(icon);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add Subject</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        color === c
                          ? 'ring-2 ring-offset-2 ring-offset-[hsl(var(--card))] scale-110'
                          : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: c, ...(color === c ? { ringColor: c } : {}) }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Icon</label>
                <div className="grid grid-cols-8 gap-2">
                  {SUBJECT_ICONS.map((iconName) => {
                    const Ic = getIcon(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-xl transition-all',
                          icon === iconName
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--card))]'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                        )}
                      >
                        <Ic className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted))] p-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white"
                  style={{ backgroundColor: color }}
                >
                  <IconPreview className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{name || 'Subject Preview'}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 hover:opacity-90 transition disabled:opacity-50"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            key="confirm-dialog"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">{message}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Subject Card
// ---------------------------------------------------------------------------
interface SubjectCardProps {
  subject: ReturnType<typeof useSubjectsStore.getState>['subjects'][number];
  index: number;
  onDelete: (id: string) => void;
}

function SubjectCard({ subject, index, onDelete }: SubjectCardProps) {
  const Icon = getIcon(subject.icon);

  const stats = useMemo(() => {
    let totalTopics = 0;
    let completed = 0;
    let revised = 0;
    let inProgress = 0;
    for (const ch of subject.chapters) {
      for (const t of ch.topics) {
        totalTopics++;
        if (t.status === 'completed') completed++;
        if (t.status === 'revised') revised++;
        if (t.status === 'in-progress') inProgress++;
      }
    }
    const done = completed + revised;
    const percent = totalTopics > 0 ? Math.round((done / totalTopics) * 100) : 0;
    return { totalTopics, completed, revised, inProgress, percent };
  }, [subject.chapters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      layout
    >
      <Link
        href={`/subjects/${subject.id}`}
        className="group block relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5"
      >
        {/* Accent top bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: subject.color }} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-lg shrink-0"
                style={{ backgroundColor: subject.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-2">
                <h3 className="font-semibold text-base group-hover:text-[hsl(var(--primary))] transition-colors truncate">
                  {subject.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 font-medium">
                  <span>{subject.chapters.length} {subject.chapters.length === 1 ? 'chapter' : 'chapters'}</span>
                  {subject.details && subject.details['Total Marks'] && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[hsl(var(--border))]" />
                      <span>{subject.details['Total Marks']} Marks</span>
                    </>
                  )}
                  {subject.details && subject.details['Total Teaching Hours'] && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[hsl(var(--border))]" />
                      <span>{subject.details['Total Teaching Hours']} Hrs</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(subject.id);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Topic stats pills */}
          {stats.totalTopics > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {stats.completed > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-medium">
                  ✓ {stats.completed}
                </span>
              )}
              {stats.revised > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 text-[11px] font-medium">
                  ↻ {stats.revised}
                </span>
              )}
              {stats.inProgress > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium">
                  ◐ {stats.inProgress}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[11px] font-medium">
                {stats.totalTopics} topics
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Progress</span>
              <span className="font-semibold" style={{ color: subject.color }}>
                {stats.percent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: subject.color }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.percent}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: index * 0.05 + 0.2 }}
              />
            </div>
          </div>

          {/* Arrow hint */}
          <div className="flex items-center justify-end mt-3">
            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Subjects Page
// ---------------------------------------------------------------------------
export default function SubjectsPage() {
  const hydrated = useHydration();
  const subjects = useSubjectsStore((s) => s.subjects);
  const addSubject = useSubjectsStore((s) => s.addSubject);
  const deleteSubject = useSubjectsStore((s) => s.deleteSubject);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const subjectToDelete = deleteTarget ? subjects.find((s) => s.id === deleteTarget) : null;

  const handleAdd = (name: string, color: string, icon: string) => {
    addSubject(name, color, icon);
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `"${name}" added successfully!`, type: 'success' } })
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const name = subjectToDelete?.name ?? 'Subject';
    deleteSubject(deleteTarget);
    setDeleteTarget(null);
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `"${name}" deleted.`, type: 'success' } })
    );
  };

  // Loading skeleton
  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-[hsl(var(--muted))] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Subjects" description="Organize your knowledge — every chapter mastered is a victory! 📚">
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </PageHeader>

      {subjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No subjects yet"
          description="Create your first subject to start organising your study material into chapters and topics."
          actionLabel="Add Subject"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {subjects.map((subject, idx) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={idx}
                onDelete={(id) => setDeleteTarget(id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add dialog */}
      <AddSubjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAdd}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? All chapters and topics will be lost. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
