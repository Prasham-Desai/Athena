'use client';

import { useMemo } from 'react';
import { FileText, BookOpen, FileCheck, Image as ImageIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import type { NoteDocument, Subject } from '@/types';

interface NotesStatsHeaderProps {
  notes: NoteDocument[];
  subjects: Subject[];
  isLoading?: boolean;
}

export function NotesStatsHeader({ notes, subjects, isLoading = false }: NotesStatsHeaderProps) {
  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const pdfNotes = notes.filter((n) => n.file_type === 'pdf');
    const imageNotes = notes.filter((n) => n.file_type !== 'pdf');

    const subjectsWithNotes = new Set(notes.map((n) => n.subject_id)).size;
    const totalPages = notes.reduce((acc, n) => acc + (n.page_count || 1), 0);
    const linkedToCurriculum = notes.filter((n) => n.chapter_id || n.topic_id).length;

    return {
      totalNotes,
      subjectsWithNotes,
      totalSubjects: subjects.length,
      pdfCount: pdfNotes.length,
      imageCount: imageNotes.length,
      totalPages,
      linkedToCurriculum,
    };
  }, [notes, subjects]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <StatCard
        title="Total Documents"
        value={stats.totalNotes}
        subtitle={`${stats.totalPages} pages indexed`}
        icon={FileText}
        color="#818cf8"
        isLoading={isLoading}
      />
      <StatCard
        title="Subjects Covered"
        value={`${stats.subjectsWithNotes} / ${stats.totalSubjects}`}
        subtitle={`${stats.totalSubjects > 0 ? Math.round((stats.subjectsWithNotes / stats.totalSubjects) * 100) : 0}% curriculum coverage`}
        icon={BookOpen}
        color="#6366f1"
        isLoading={isLoading}
      />
      <StatCard
        title="PDF Documents"
        value={stats.pdfCount}
        subtitle="Lecture slides & textbooks"
        icon={FileCheck}
        color="#f43f5e"
        isLoading={isLoading}
      />
      <StatCard
        title="Diagrams & Visuals"
        value={stats.imageCount}
        subtitle="Handwritten & anatomy diagrams"
        icon={ImageIcon}
        color="#10b981"
        isLoading={isLoading}
      />
    </div>
  );
}
