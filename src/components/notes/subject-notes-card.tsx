'use client';

import React from 'react';
import { SubjectCard } from '@/components/shared/subject-card';
import type { Subject } from '@/types';

export interface SubjectNotesCardProps {
  subject: Subject;
  stats: { total: number; pdfs: number; images: number };
  onSelect: (subjectId: string) => void;
  index?: number;
}

export function SubjectNotesCard({
  subject,
  stats,
  onSelect,
  index = 0,
}: SubjectNotesCardProps) {
  return (
    <SubjectCard
      subject={subject}
      index={index}
      variant="notes"
      noteStats={stats}
      onSelect={onSelect}
    />
  );
}

export default SubjectNotesCard;
