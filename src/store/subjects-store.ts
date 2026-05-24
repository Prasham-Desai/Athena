import { create } from 'zustand';
import type { Subject, Chapter, Topic, TopicStatus, ImportanceTag } from '@/types';
import { generateId, getSpacedRepetitionDate, getToday } from '@/lib/utils';
import { INITIAL_SUBJECTS } from '@/lib/curriculum-data';

interface SubjectsState {
  subjects: Subject[];
  fetchSubjects: () => Promise<void>;
  addSubject: (name: string, color: string, icon: string) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Omit<Subject, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addChapter: (subjectId: string, name: string, paper?: string) => Promise<void>;
  updateChapter: (subjectId: string, chapterId: string, updates: Partial<Omit<Chapter, 'id' | 'topics' | 'order'>>) => Promise<void>;
  deleteChapter: (subjectId: string, chapterId: string) => Promise<void>;
  addTopic: (subjectId: string, chapterId: string, name: string) => Promise<void>;
  updateTopic: (subjectId: string, chapterId: string, topicId: string, updates: Partial<Topic>) => Promise<void>;
  deleteTopic: (subjectId: string, chapterId: string, topicId: string) => Promise<void>;
  setTopicStatus: (subjectId: string, chapterId: string, topicId: string, status: TopicStatus) => Promise<void>;
  setAllChapterTopicsStatus: (subjectId: string, chapterId: string, status: TopicStatus) => Promise<void>;
  markTopicRevised: (subjectId: string, chapterId: string, topicId: string) => Promise<void>;
  setChapterTag: (subjectId: string, chapterId: string, tag: ImportanceTag | null) => Promise<void>;
  setSubjects: (subjects: Subject[]) => void;
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],

  fetchSubjects: async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const { data } = (await response.json()) as any;
        set({ subjects: data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  },

  addSubject: async (name, color, icon) => {
    const newSubject = {
      id: generateId(),
      name,
      color,
      icon,
      chapters: [],
      createdAt: new Date().toISOString(),
      order: get().subjects.length,
    };
    set((state) => ({ subjects: [...state.subjects, newSubject as any] }));
    try {
      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
    } catch (error) {
      console.error('Failed to add subject', error);
    }
  },

  updateSubject: async (id, updates) => {
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    try {
      await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update subject', error);
    }
  },

  deleteSubject: async (id) => {
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
    }));
    try {
      await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete subject', error);
    }
  },

  addChapter: async (subjectId, name, paper = "Paper 1") => {
    const newChapter = {
      id: generateId(),
      name,
      topics: [],
      order: get().subjects.find((s) => s.id === subjectId)?.chapters.length || 0,
      tag: null,
      estimatedMarks: null,
      paper,
      subject_id: subjectId,
    };
    
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === subjectId ? { ...s, chapters: [...s.chapters, newChapter as any] } : s
      ),
    }));

    try {
      await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChapter),
      });
    } catch (error) {
      console.error('Failed to add chapter', error);
    }
  },

  updateChapter: async (subjectId, chapterId, updates) => {
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
    }));

    try {
      await fetch(`/api/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update chapter', error);
    }
  },

  deleteChapter: async (subjectId, chapterId) => {
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
          : s
      ),
    }));

    try {
      await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete chapter', error);
    }
  },

  addTopic: async (subjectId, chapterId, name) => {
    const newTopic = {
      id: generateId(),
      name,
      status: 'not-started' as TopicStatus,
      revisionCount: 0,
      lastRevised: null,
      nextRevisionDue: null,
      order: get().subjects.find((s) => s.id === subjectId)?.chapters.find((c) => c.id === chapterId)?.topics.length || 0,
      notes: '',
      completedAt: null,
      chapter_id: chapterId,
    };

    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId
                  ? { ...c, topics: [...c.topics, newTopic as any] }
                  : c
              ),
            }
          : s
      ),
    }));

    try {
      await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic),
      });
    } catch (error) {
      console.error('Failed to add topic', error);
    }
  },

  updateTopic: async (subjectId, chapterId, topicId, updates) => {
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
    }));

    try {
      await fetch(`/api/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update topic', error);
    }
  },

  deleteTopic: async (subjectId, chapterId, topicId) => {
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
    }));

    try {
      await fetch(`/api/topics/${topicId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete topic', error);
    }
  },

  setTopicStatus: async (subjectId, chapterId, topicId, status) => {
    const updates = {
      status,
      completedAt: status === 'completed' || status === 'revised' ? new Date().toISOString() : null,
      nextRevisionDue: status === 'completed' ? getSpacedRepetitionDate(0) : null,
    };
    get().updateTopic(subjectId, chapterId, topicId, updates);
  },

  markTopicRevised: async (subjectId, chapterId, topicId) => {
    const subject = get().subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    const topic = chapter?.topics.find((t) => t.id === topicId);
    
    if (!topic) return;

    const updates = {
      status: 'revised' as TopicStatus,
      revisionCount: (topic.revisionCount || 0) + 1,
      lastRevised: getToday(),
      nextRevisionDue: getSpacedRepetitionDate((topic.revisionCount || 0) + 1),
    };
    get().updateTopic(subjectId, chapterId, topicId, updates);
  },

  setAllChapterTopicsStatus: async (subjectId, chapterId, status) => {
    const subject = get().subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    
    if (!chapter) return;

    chapter.topics.forEach((topic) => {
      get().setTopicStatus(subjectId, chapterId, topic.id, status);
    });
  },

  setChapterTag: async (subjectId, chapterId, tag) => {
    get().updateChapter(subjectId, chapterId, { tag });
  },

  setSubjects: (subjects) => set({ subjects }),
}));
