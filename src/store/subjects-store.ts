import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Subject, Chapter, Topic, TopicStatus, ImportanceTag } from '@/types';
import { generateId, getSpacedRepetitionDate, getToday } from '@/lib/utils';
import { INITIAL_SUBJECTS } from '@/lib/curriculum-data';

interface SubjectsState {
  subjects: Subject[];
  addSubject: (name: string, color: string, icon: string) => void;
  updateSubject: (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt'>>) => void;
  deleteSubject: (id: string) => void;
  addChapter: (subjectId: string, name: string, paper?: string) => void;
  updateChapter: (subjectId: string, chapterId: string, updates: Partial<Omit<Chapter, 'id' | 'topics' | 'order'>>) => void;
  deleteChapter: (subjectId: string, chapterId: string) => void;
  addTopic: (subjectId: string, chapterId: string, name: string) => void;
  updateTopic: (subjectId: string, chapterId: string, topicId: string, updates: Partial<Topic>) => void;
  deleteTopic: (subjectId: string, chapterId: string, topicId: string) => void;
  setTopicStatus: (subjectId: string, chapterId: string, topicId: string, status: TopicStatus) => void;
  setAllChapterTopicsStatus: (subjectId: string, chapterId: string, status: TopicStatus) => void;
  markTopicRevised: (subjectId: string, chapterId: string, topicId: string) => void;
  setChapterTag: (subjectId: string, chapterId: string, tag: ImportanceTag | null) => void;
  reorderSubjects: (subjects: Subject[]) => void;
  setSubjects: (subjects: Subject[]) => void;
}

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set) => ({
      subjects: INITIAL_SUBJECTS,

      addSubject: (name, color, icon) =>
        set((state) => ({
          subjects: [
            ...state.subjects,
            {
              id: generateId(),
              name,
              color,
              icon,
              chapters: [],
              createdAt: new Date().toISOString(),
              order: state.subjects.length,
            },
          ],
        })),

      updateSubject: (id, updates) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
        })),

      addChapter: (subjectId, name, paper = "Paper 1") =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: [
                    ...s.chapters,
                    {
                      id: generateId(),
                      name,
                      topics: [],
                      order: s.chapters.length,
                      tag: null,
                      estimatedMarks: null,
                      paper
                    },
                  ],
                }
              : s
          ),
        })),

      updateChapter: (subjectId, chapterId, updates) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId ? { ...c, ...updates } : c
                  ),
                }
              : s
          ),
        })),

      deleteChapter: (subjectId, chapterId) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
              : s
          ),
        })),

      addTopic: (subjectId, chapterId, name) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          topics: [
                            ...c.topics,
                            {
                              id: generateId(),
                              name,
                              status: 'not-started' as TopicStatus,
                              revisionCount: 0,
                              lastRevised: null,
                              nextRevisionDue: null,
                              order: c.topics.length,
                              notes: '',
                              completedAt: null,
                            },
                          ],
                        }
                      : c
                  ),
                }
              : s
          ),
        })),

      updateTopic: (subjectId, chapterId, topicId, updates) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          topics: c.topics.map((t) =>
                            t.id === topicId ? { ...t, ...updates } : t
                          ),
                        }
                      : c
                  ),
                }
              : s
          ),
        })),

      deleteTopic: (subjectId, chapterId, topicId) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? { ...c, topics: c.topics.filter((t) => t.id !== topicId) }
                      : c
                  ),
                }
              : s
          ),
        })),

      setTopicStatus: (subjectId, chapterId, topicId, status) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          topics: c.topics.map((t) =>
                            t.id === topicId
                              ? {
                                  ...t,
                                  status,
                                  completedAt:
                                    status === 'completed' || status === 'revised'
                                      ? new Date().toISOString()
                                      : t.completedAt,
                                  nextRevisionDue:
                                    status === 'completed'
                                      ? getSpacedRepetitionDate(0)
                                      : t.nextRevisionDue,
                                }
                              : t
                          ),
                        }
                      : c
                  ),
                }
              : s
          ),
        })),

      markTopicRevised: (subjectId, chapterId, topicId) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          topics: c.topics.map((t) =>
                            t.id === topicId
                              ? {
                                  ...t,
                                  status: 'revised' as TopicStatus,
                                  revisionCount: t.revisionCount + 1,
                                  lastRevised: getToday(),
                                  nextRevisionDue: getSpacedRepetitionDate(t.revisionCount + 1),
                                }
                              : t
                          ),
                        }
                      : c
                  ),
                }
              : s
          ),
        })),

      setAllChapterTopicsStatus: (subjectId, chapterId, status) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          topics: c.topics.map((t) => ({
                            ...t,
                            status,
                            completedAt:
                              (status === 'completed' || status === 'revised')
                                ? (t.completedAt ?? new Date().toISOString())
                                : null,
                            nextRevisionDue:
                              status === 'completed' && !t.nextRevisionDue
                                ? getSpacedRepetitionDate(0)
                                : status === 'not-started'
                                ? null
                                : t.nextRevisionDue,
                          })),
                        }
                      : c
                  ),
                }
              : s
          ),
        })),

      setChapterTag: (subjectId, chapterId, tag) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  chapters: s.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          tag,
                        }
                      : c
                  ),
                }
              : s
          ),
        })),

      reorderSubjects: (subjects) => set({ subjects }),

      setSubjects: (subjects) => set({ subjects }),
    }),
    {
      name: 'study-tracker-subjects-v2',
    }
  )
);
