'use client';

import React from 'react';
import { SubjectCard } from '@/components/shared/subject-card';
import type { Subject } from '@/types';

export interface RevisionSubjectCardProps {
  subject: Subject;
  index: number;
}

export function RevisionSubjectCard({ subject, index }: RevisionSubjectCardProps) {
  return <SubjectCard subject={subject} index={index} variant="revisions" />;
}

export default RevisionSubjectCard;
