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
  undoRevision: (subjectId: string, chapterId: string, topicId: string) => Promise<void>;
  setChapterTag: (subjectId: string, chapterId: string, tag: ImportanceTag | null) => Promise<void>;
  setSubtopicStatus: (subjectId: string, chapterId: string, topicId: string, subtopicId: string, status: string, skipParentUpdate?: boolean) => Promise<void>;
  setTopicRevisionCount: (subjectId: string, chapterId: string, topicId: string, count: number) => Promise<void>;
  setChapterRevisionCount: (subjectId: string, chapterId: string, count: number) => Promise<void>;
  setSubtopicRevisionCount: (subjectId: string, chapterId: string, topicId: string, subtopicId: string, count: number) => Promise<void>;
  resetAllRevisions: () => Promise<void>;
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
    const previousSubjects = get().subjects;
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
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to add subject', error);
      throw error;
    }
  },

  updateSubject: async (id, updates) => {
    const previousSubjects = get().subjects;
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to update subject', error);
      throw error;
    }
  },

  deleteSubject: async (id) => {
    const previousSubjects = get().subjects;
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
    }));
    try {
      const response = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to delete subject', error);
      throw error;
    }
  },

  addChapter: async (subjectId, name, paper = "Paper 1") => {
    const previousSubjects = get().subjects;
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
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChapter),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to add chapter', error);
      throw error;
    }
  },

  updateChapter: async (subjectId, chapterId, updates) => {
    const previousSubjects = get().subjects;
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
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to update chapter', error);
      throw error;
    }
  },

  deleteChapter: async (subjectId, chapterId) => {
    const previousSubjects = get().subjects;
    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
          : s
      ),
    }));

    try {
      const response = await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to delete chapter', error);
      throw error;
    }
  },

  addTopic: async (subjectId, chapterId, name) => {
    const previousSubjects = get().subjects;
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
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to add topic', error);
      throw error;
    }
  },

  updateTopic: async (subjectId, chapterId, topicId, updates) => {
    const previousSubjects = get().subjects;
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
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to update topic', error);
      throw error;
    }
  },

  deleteTopic: async (subjectId, chapterId, topicId) => {
    const previousSubjects = get().subjects;
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
      const response = await fetch(`/api/topics/${topicId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed');
    } catch (error) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error('Failed to delete topic', error);
      throw error;
    }
  },

  setTopicStatus: async (subjectId, chapterId, topicId, status) => {
    const updates = {
      status,
      completedAt: status === 'completed' || status === 'revised' ? new Date().toISOString() : null,
      nextRevisionDue: status === 'completed' ? getSpacedRepetitionDate(0) : null,
    };

    // Auto check all children
    if (status === 'completed' || status === 'not-started') {
       const substatus = status;
       const subject = get().subjects.find((s) => s.id === subjectId);
       const chapter = subject?.chapters.find((c) => c.id === chapterId);
       const topic = chapter?.topics.find((t) => t.id === topicId);
       if (topic && topic.subtopics) {
         topic.subtopics.forEach((sub) => {
            if (sub.status !== substatus) {
              get().setSubtopicStatus(subjectId, chapterId, topicId, sub.id, substatus, true);
            }
         });
       }
    }

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

  undoRevision: async (subjectId, chapterId, topicId) => {
    const subject = get().subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    const topic = chapter?.topics.find((t) => t.id === topicId);
    
    if (!topic || topic.revisionCount <= 0) return;

    const newCount = topic.revisionCount - 1;
    const updates: Partial<Topic> = {
      revisionCount: newCount,
      lastRevised: newCount > 0 ? topic.lastRevised : null,
      nextRevisionDue: newCount > 0 ? getSpacedRepetitionDate(newCount) : getSpacedRepetitionDate(0),
      status: newCount === 0 ? 'completed' as TopicStatus : 'revised' as TopicStatus,
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

  setSubtopicStatus: async (subjectId, chapterId, topicId, subtopicId, status, skipParentUpdate = false) => {
    const previousSubjects = get().subjects;
    set((state) => ({
      subjects: state.subjects.map((s) => s.id === subjectId ? {
        ...s, chapters: s.chapters.map((c) => c.id === chapterId ? {
          ...c, topics: c.topics.map((t) => t.id === topicId ? {
            ...t, subtopics: t.subtopics?.map((sub: any) => sub.id === subtopicId ? {
              ...sub, status
            } : sub)
          } : t)
        } : c)
      } : s)
    }));

    try {
      const response = await fetch(`/api/subtopics/${subtopicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed');
    } catch (e) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error(e);
      throw e;
    }

    if (!skipParentUpdate) {
      const subject = get().subjects.find((s) => s.id === subjectId);
      const chapter = subject?.chapters.find((c) => c.id === chapterId);
      const topic = chapter?.topics.find((t) => t.id === topicId);
      if (topic && topic.subtopics) {
        const allCompleted = topic.subtopics.every((sub: any) => sub.status === 'completed');
        if (allCompleted && topic.status !== 'completed') {
           get().setTopicStatus(subjectId, chapterId, topicId, 'completed');
        } else if (!allCompleted && topic.status === 'completed') {
           get().setTopicStatus(subjectId, chapterId, topicId, 'in-progress');
        }
      }
    }
  },

  setSubjects: (subjects) => set({ subjects }),

  setTopicRevisionCount: async (subjectId, chapterId, topicId, count) => {
    const subject = get().subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    const topic = chapter?.topics.find((t) => t.id === topicId);

    const updates: Partial<Topic> = {
      revisionCount: count,
      lastRevised: count > 0 ? getToday() : null, // keep simple string date
      status: count > 0 ? 'revised' as TopicStatus : 'completed' as TopicStatus,
    };

    // Auto update all children
    if (topic && topic.subtopics) {
      topic.subtopics.forEach((sub: any) => {
        if (sub.revisionCount !== count) {
          get().setSubtopicRevisionCount(subjectId, chapterId, topicId, sub.id, count);
        }
      });
    }

    await get().updateTopic(subjectId, chapterId, topicId, updates);
  },

  setChapterRevisionCount: async (subjectId, chapterId, count) => {
    const subject = get().subjects.find((s) => s.id === subjectId);
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    
    if (chapter && chapter.topics) {
      chapter.topics.forEach((topic) => {
        // We reuse setTopicRevisionCount which internally also handles subtopics
        get().setTopicRevisionCount(subjectId, chapterId, topic.id, count);
      });
    }
  },

  setSubtopicRevisionCount: async (subjectId, chapterId, topicId, subtopicId, count) => {
    const previousSubjects = get().subjects;
    set((state) => ({
      subjects: state.subjects.map((s) => s.id === subjectId ? {
        ...s, chapters: s.chapters.map((c) => c.id === chapterId ? {
          ...c, topics: c.topics.map((t) => t.id === topicId ? {
            ...t, subtopics: t.subtopics?.map((sub: any) => sub.id === subtopicId ? {
              ...sub, revisionCount: count
            } : sub)
          } : t)
        } : c)
      } : s)
    }));

    try {
      const response = await fetch(`/api/subtopics/${subtopicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionCount: count })
      });
      if (!response.ok) throw new Error('Failed');
    } catch (e) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'Action failed', type: 'error' } }));
      console.error(e);
      throw e;
    }
  },

  resetAllRevisions: async () => {
    const previousSubjects = get().subjects;
    
    // Optimistic UI update
    set((state) => ({
      subjects: state.subjects.map(s => ({
        ...s,
        chapters: s.chapters.map(c => ({
          ...c,
          topics: c.topics.map(t => ({
            ...t,
            revisionCount: 0,
            status: t.status === 'revised' ? 'completed' : t.status,
            subtopics: t.subtopics?.map((sub: any) => ({ ...sub, revisionCount: 0 }))
          }))
        }))
      }))
    }));

    try {
      const response = await fetch('/api/reset-revisions', { method: 'POST' });
      if (!response.ok) throw new Error('Failed');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'All revisions have been reset', type: 'success' } }));
    } catch (e) {
      set({ subjects: previousSubjects });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('add-toast', { detail: { message: 'Reset failed', type: 'error' } }));
      console.error(e);
      throw e;
    }
  },
}));
