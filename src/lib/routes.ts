export const subjectListHref = () => '/subjects';

export const subjectDetailHref = (subjectId: string) => `/subjects/${encodeURIComponent(subjectId)}`;

export const revisionSubjectHref = (subjectId: string) => `/revisions/${encodeURIComponent(subjectId)}`;

export function subjectNotesHref(subjectId: string, yearId?: string) {
  const params = new URLSearchParams({ subjectId });
  if (yearId) params.set('yearId', yearId);
  return `/notes?${params.toString()}`;
}

export const plannerTasksHref = () => '/planner#tasks';

export const plannerDateHref = (date: string) => `/planner?date=${encodeURIComponent(date)}`;
