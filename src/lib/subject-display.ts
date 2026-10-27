import type { Subject } from '@/types';

/** Returns the concise syllabus name used in cards, lists, and controls. */
export function getSubjectDisplayName(subject: Pick<Subject, 'name' | 'details'>): string {
  return subject.name;
}

/** Returns a distinct English title for use on an opened subject page. */
export function getSubjectEnglishTitle(subject: Pick<Subject, 'name' | 'details'>): string | null {
  const englishTitle = subject.details?.['English Title']?.trim();
  if (!englishTitle || englishTitle.toLocaleLowerCase() === subject.name.trim().toLocaleLowerCase()) {
    return null;
  }

  return englishTitle;
}
