import type { Subject } from '@/types';

/** Returns the syllabus name with its source-provided English title, when one exists. */
export function getSubjectDisplayName(subject: Pick<Subject, 'name' | 'details'>): string {
  const englishTitle = subject.details?.['English Title']?.trim();
  if (!englishTitle || englishTitle.toLocaleLowerCase() === subject.name.trim().toLocaleLowerCase()) {
    return subject.name;
  }

  return `${subject.name} (${englishTitle})`;
}
