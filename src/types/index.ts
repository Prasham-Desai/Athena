// ============================================================
// Study Management Tracker — Core Type Definitions
// ============================================================

export type TopicStatus = 'not-started' | 'in-progress' | 'completed' | 'revised';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 'study' | 'assignment' | 'revision' | 'exam-prep' | 'other';

export type ImportanceTag =
  | 'low'
  | 'med'
  | 'high'
  | 'very-high';

export interface Topic {
  id: string;
  chapter_id?: string;
  name: string;
  status: TopicStatus;
  revisionCount: number;
  lastRevised: string | null;     // ISO date string
  nextRevisionDue: string | null; // ISO date string
  order: number;
  notes: string;
  completedAt: string | null;     // ISO date string
  importance?: string | null;
  subtopics?: any[];
}

export interface Chapter {
  id: string;
  subject_id?: string;
  name: string;
  topics: Topic[];
  order: number;
  tag: ImportanceTag | null;
  estimatedMarks: number | null;
  paper?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;       // hex color
  icon: string;        // lucide icon name
  chapters: Chapter[];
  createdAt: string;   // ISO date string
  order: number;
  details?: Record<string, string>;
}

export interface StudyBlock {
  id: string;
  date: string;        // YYYY-MM-DD
  subjectId: string;
  topicId?: string;
  title: string;
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  priority: Priority;
  completed: boolean;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  completed: boolean;
  date: string;            // YYYY-MM-DD
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  createdAt: string;       // ISO date string
  completedAt: string | null;
}

export interface ActivityEntry {
  id: string;
  type: 'topic-completed' | 'topic-revised' | 'task-completed' | 'subject-added' | 'study-block-completed' | 'milestone';
  description: string;
  timestamp: string;   // ISO date string
  subjectId?: string;
  color?: string;
}

export interface StudySession {
  id: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  durationMinutes: number;
  type: 'manual' | 'timer' | 'task';
  title?: string;
  taskId?: string;
}

export interface DailyLog {
  date: string;        // YYYY-MM-DD
  studyMinutes: number;
  topicsCompleted: number;
  tasksCompleted: number;
  revisionsCompleted: number;
  sessions?: StudySession[];
}

export type ExamType = 'test' | 'exam';

export interface ExamSubject {
  id: string;
  date?: string; // YYYY-MM-DD
}

export interface Exam {
  id: string;
  title: string;
  type: ExamType;
  date: string;        // YYYY-MM-DD
  subjects: ExamSubject[]; // parsed from JSON
  completed: boolean;
  createdAt?: string;
}

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  dailyStudyGoalHours: number;
  showWelcome: boolean;
  pomodoroMinutes: number;
  breakMinutes: number;
  fontSize: FontSize;
}

// Computed/derived types for UI
export interface SubjectProgress {
  subjectId: string;
  name: string;
  color: string;
  icon: string;
  totalTopics: number;
  completedTopics: number;
  revisedTopics: number;
  inProgressTopics: number;
  completionPercent: number;
  revisionPercent: number;
}

export interface RevisionItem {
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  revisionCount: number;
  lastRevised: string | null;
  nextRevisionDue: string | null;
  isOverdue: boolean;
  isDueToday: boolean;
}

// Backend API Wrappers
export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  content: string | null;
  order_index: number;
  importance: string | null;
  created_at: string;
}

export interface TopicWithSubtopics extends Topic {
  subtopics: Subtopic[];
}

export interface ChapterWithTopics extends Chapter {
  topics: TopicWithSubtopics[];
}

export interface SubjectWithChapters extends Subject {
  chapters: ChapterWithTopics[];
}

export interface AudioNoteMeta {
  id: string;
  subtopic_id: string;
  duration_seconds: number;
  mime_type: string;
  file_size: number;
  kv_key: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
