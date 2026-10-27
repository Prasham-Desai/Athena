'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Pencil,
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
  ArrowDownWideNarrow,
  Layers,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useSubjectsStore } from '@/store/subjects-store';
import { useHydration } from '@/hooks/use-hydration';
import { PageHeader } from '@/components/shared/page-header';
import { CardGridLoader, PageLoader } from '@/components/ui/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, SUBJECT_COLORS, SUBJECT_ICONS, getToday } from '@/lib/utils';
import { useActivityStore } from '@/store/activity-store';

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
// ---------------------------------------------------------------------------
// Subject Dialog (Add & Edit)
// ---------------------------------------------------------------------------
interface SubjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, icon: string) => void;
  initialName?: string;
  initialColor?: string;
  initialIcon?: string;
  isEdit?: boolean;
}

function SubjectDialog({ 
  open, 
  onClose, 
  onSave, 
  initialName = '', 
  initialColor = SUBJECT_COLORS[0], 
  initialIcon = SUBJECT_ICONS[0], 
  isEdit = false 
}: SubjectDialogProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [icon, setIcon] = useState(initialIcon);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(initialColor);
      setIcon(initialIcon);
    }
  }, [open, initialName, initialColor, initialIcon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, color, icon);
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
              <h2 className="text-lg font-semibold">{isEdit ? 'Edit Subject' : 'Add Subject'}</h2>
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
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
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
                  {isEdit ? 'Save Changes' : 'Add Subject'}
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
  onEdit: (id: string) => void;
}

function SubjectCard({ subject, index, onDelete, onEdit }: SubjectCardProps) {
  const Icon = getIcon(subject.icon);

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
    const done = completed + revised;
    const percent = totalTopics > 0 ? Math.round((done / totalTopics) * 100) : 0;
    return { totalTopics, percent };
  }, [subject.chapters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      layout
    >
      <article className="group relative h-full overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300 hover:border-[hsl(var(--ring))]/60 hover:shadow-lg hover:shadow-black/20">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
          style={{ backgroundColor: subject.color }}
        />
        {/* Left accent strip */}
        <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: subject.color }} />
        
        <div className="p-4 pl-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/subjects/${subject.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${subject.color}22`, color: subject.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 pr-1">
                <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-[hsl(var(--primary))]">
                  {subject.name}
                </h3>
                <div className="mt-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                  {subject.chapters.length} {subject.chapters.length === 1 ? 'chapter' : 'chapters'}
                </div>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => onEdit(subject.id)}
                aria-label={`Edit ${subject.name}`}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-indigo-500/10 hover:text-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(subject.id)}
                aria-label={`Delete ${subject.name}`}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <Link
            href={`/subjects/${subject.id}`}
            className="mt-4 block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            {/* Topics Stat Box */}
            <div className="rounded-xl border border-[hsl(var(--border))]/60 bg-white/[0.02] p-3 transition-colors group-hover:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
                      {stats.totalTopics}
                    </span>
                    <span className="ml-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      {stats.totalTopics === 1 ? 'Topic' : 'Topics'}
                    </span>
                  </div>
                </div>

                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums"
                  style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
                >
                  {stats.percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]/70">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: subject.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.04 }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-end text-[11px] font-medium text-indigo-400 transition-colors group-hover:text-indigo-300">
              <span className="inline-flex items-center gap-1">
                Open subject <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </article>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Subjects Page
// ---------------------------------------------------------------------------
export default function SubjectsPage() {
  const hydrated = useHydration();
  const subjects = useSubjectsStore((s) => s.subjects);
  const subjectsLoading = useSubjectsStore((s) => s.isLoading);
  const addSubject = useSubjectsStore((s) => s.addSubject);
  const deleteSubject = useSubjectsStore((s) => s.deleteSubject);
  const updateSubject = useSubjectsStore((s) => s.updateSubject);
  const activities = useActivityStore((s) => s.activities);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'attention' | 'progress' | 'remaining' | 'activity'>('attention');

  const subjectToEdit = editTarget ? subjects.find((s) => s.id === editTarget) : null;
  const subjectToDelete = deleteTarget ? subjects.find((s) => s.id === deleteTarget) : null;
  const syllabusStats = useMemo(() => {
    const topics = subjects.flatMap((subject) => subject.chapters.flatMap((chapter) => chapter.topics));
    const completed = topics.filter((topic) => topic.status === 'completed' || topic.status === 'revised').length;
    return { total: topics.length, completed, percent: topics.length ? Math.round(completed / topics.length * 100) : 0 };
  }, [subjects]);
  const visibleSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subjects.filter((subject) => !query || subject.name.toLowerCase().includes(query)).map((subject) => {
      const topics = subject.chapters.flatMap((chapter) => chapter.topics);
      const completed = topics.filter((topic) => topic.status === 'completed' || topic.status === 'revised').length;
      const dueRevisions = topics.filter((topic) => (topic.status === 'completed' || topic.status === 'revised') && topic.nextRevisionDue && topic.nextRevisionDue <= getToday()).length;
      const lastActivity = activities.filter((activity) => activity.subjectId === subject.id).reduce((latest, activity) => Math.max(latest, new Date(activity.timestamp).getTime() || 0), 0);
      return { subject, completed, remaining: topics.length - completed, dueRevisions, percent: topics.length ? Math.round(completed / topics.length * 100) : 0, lastActivity };
    }).sort((a, b) => {
      if (sort === 'progress') return b.percent - a.percent;
      if (sort === 'remaining') return b.remaining - a.remaining;
      if (sort === 'activity') return b.lastActivity - a.lastActivity;
      return (b.dueRevisions - a.dueRevisions) || (b.remaining - a.remaining);
    }).map(({ subject }) => subject);
  }, [subjects, activities, search, sort]);

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

  const handleEdit = (name: string, color: string, icon: string) => {
    if (!editTarget) return;
    updateSubject(editTarget, { name, color, icon });
    setEditTarget(null);
    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: `"${name}" updated successfully!`, type: 'success' } })
    );
  };

  // Loading skeleton
  if (!hydrated) {
    return <PageLoader label="Loading subjects" variant="cards" />;
  }

  return (
    <>
      <PageHeader title="Subjects" description="Your syllabus, organized into focused learning spaces." className="mb-5">
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </PageHeader>

      <section className="mb-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:flex sm:items-center sm:justify-between sm:gap-6" aria-label="Syllabus overview">
        <div className="mb-4 flex items-center gap-4 sm:mb-0">
          <div className="min-w-20"><p className="text-2xl font-semibold tabular-nums">{syllabusStats.percent}%</p><p className="text-[11px] text-[hsl(var(--muted-foreground))]">syllabus complete</p></div>
          <div className="h-9 w-px bg-[hsl(var(--border))]" />
          <p className="text-xs text-[hsl(var(--muted-foreground))]"><span className="font-medium text-[hsl(var(--foreground))]">{subjects.length} subjects</span><br />{syllabusStats.completed} of {syllabusStats.total} topics complete</p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-1 sm:justify-end">
          <label className="relative block sm:w-60"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><span className="sr-only">Search subjects</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects" className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <label className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3"><ArrowDownWideNarrow className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /><span className="sr-only">Sort subjects</span><select aria-label="Sort subjects" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-10 min-w-36 bg-transparent text-xs outline-none"><option value="attention">Needs attention</option><option value="progress">Progress</option><option value="remaining">Topics remaining</option><option value="activity">Recent activity</option></select></label>
        </div>
      </section>

      {subjectsLoading ? (
        <CardGridLoader cards={6} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No subjects yet"
          description="Create your first subject to start organising your study material into chapters and topics."
          actionLabel="Add Subject"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleSubjects.map((subject, idx) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={idx}
                onDelete={(id) => setDeleteTarget(id)}
                onEdit={(id) => setEditTarget(id)}
              />
            ))}
          </AnimatePresence>
          {visibleSubjects.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-[hsl(var(--border))] py-12 text-center"><Search className="mx-auto h-6 w-6 text-[hsl(var(--muted-foreground))]" /><p className="mt-2 text-sm font-medium">No subjects match “{search}”</p><button type="button" onClick={() => setSearch('')} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Clear search</button></div>}
        </div>
      )}

      {/* Add dialog */}
      <SubjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleAdd}
      />

      {/* Edit dialog */}
      <SubjectDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        initialName={subjectToEdit?.name}
        initialColor={subjectToEdit?.color}
        initialIcon={subjectToEdit?.icon}
        isEdit={true}
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
