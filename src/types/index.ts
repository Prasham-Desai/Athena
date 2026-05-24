export interface Subject {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  status: 'pending' | 'completed' | 'revised';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  content: string | null;
  order_index: number;
  created_at: string;
}

export interface DailyProgress {
  date: string;
  study_minutes: number;
  created_at: string;
  updated_at: string;
}

// Nested payload types for API responses
export interface TopicWithSubtopics extends Topic {
  subtopics: Subtopic[];
}

export interface ChapterWithTopics extends Chapter {
  topics: TopicWithSubtopics[];
}

export interface SubjectWithChapters extends Subject {
  chapters: ChapterWithTopics[];
}

// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
