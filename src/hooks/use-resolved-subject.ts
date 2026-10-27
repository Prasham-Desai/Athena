'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { useSubjectsStore } from '@/store/subjects-store';
import type { Subject } from '@/types';

/** Resolve canonical subject URLs against their owning year, including direct links. */
export function useResolvedSubject(subjectId: string, hydrated: boolean) {
  const subjects = useSubjectsStore((state) => state.subjects);
  const subjectsLoading = useSubjectsStore((state) => state.isLoading);
  const fetchSubjects = useSubjectsStore((state) => state.fetchSubjects);
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const years = useAcademicYearStore((state) => state.years);
  const isSwitching = useAcademicYearStore((state) => state.isSwitching);
  const setActiveYearId = useAcademicYearStore((state) => state.setActiveYearId);
  const [missingSubjectId, setMissingSubjectId] = useState<string | null>(null);
  const resolvedId = useRef<string | null>(null);

  const subject = useMemo(() => subjects.find((candidate) => {
    if (candidate.id !== subjectId) return false;
    const yearId = candidate.academic_year_id || candidate.academicYearId;
    return !yearId || yearId === activeYearId;
  }), [subjects, subjectId, activeYearId]);

  useEffect(() => {
    if (!hydrated || subjectsLoading || isSwitching || !subjectId) return;

    if (subject) {
      resolvedId.current = subjectId;
      return;
    }

    if (resolvedId.current === subjectId) return;
    resolvedId.current = subjectId;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/subjects/${encodeURIComponent(subjectId)}`, { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setMissingSubjectId(subjectId);
          return;
        }

        const payload = (await response.json()) as { data?: { academic_year_id?: string; academicYearId?: string } };
        const targetYearId = payload.data?.academic_year_id || payload.data?.academicYearId;
        if (!targetYearId || !years.some((year) => year.id === targetYearId)) {
          if (!cancelled) setMissingSubjectId(subjectId);
          return;
        }

        if (cancelled || useAcademicYearStore.getState().isSwitching) return;

        if (targetYearId === activeYearId) {
          await fetchSubjects(targetYearId);
        } else {
          await setActiveYearId(targetYearId);
        }

        if (cancelled || useAcademicYearStore.getState().isSwitching) return;
        const wasLoaded = useSubjectsStore.getState().subjects.some((candidate) => candidate.id === subjectId);
        if (!cancelled && !wasLoaded) setMissingSubjectId(subjectId);
      } catch (error) {
        console.error('Failed to resolve subject link', error);
        if (!cancelled) setMissingSubjectId(subjectId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, subjectsLoading, isSwitching, subjectId, subject, years, activeYearId, fetchSubjects, setActiveYearId]);

  return {
    subject: subject as Subject | undefined,
    isResolving: !subject && (subjectsLoading || isSwitching || missingSubjectId !== subjectId),
  };
}
