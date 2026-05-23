import type { Subject, StudyBlock, Task, ActivityEntry, DailyLog } from '@/types';
import { getDaysFromNow, getToday } from './utils';

// Helper to create dates relative to today
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const mockSubjects: Subject[] = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    color: '#6366f1',
    icon: 'Calculator',
    order: 0,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    chapters: [
      {
        id: 'ch-calc',
        name: 'Calculus',
        order: 0, tag: null, estimatedMarks: null,
        topics: [
          { id: 't1', name: 'Limits & Continuity', status: 'revised', revisionCount: 2, lastRevised: daysAgo(2), nextRevisionDue: getDaysFromNow(5), order: 0, notes: '', completedAt: null },
          { id: 't2', name: 'Derivatives', status: 'completed', revisionCount: 1, lastRevised: daysAgo(5), nextRevisionDue: getDaysFromNow(2), order: 1, notes: '', completedAt: null },
          { id: 't3', name: 'Integration', status: 'in-progress', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 2, notes: '', completedAt: null },
          { id: 't4', name: 'Differential Equations', status: 'not-started', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 3, notes: '', completedAt: null },
        ],
      },
      {
        id: 'ch-algebra',
        name: 'Linear Algebra',
        order: 1, tag: null, estimatedMarks: null,
        topics: [
          { id: 't5', name: 'Matrices', status: 'completed', revisionCount: 1, lastRevised: daysAgo(3), nextRevisionDue: getDaysFromNow(4), order: 0, notes: '', completedAt: null },
          { id: 't6', name: 'Eigenvalues', status: 'in-progress', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 1, notes: '', completedAt: null },
          { id: 't7', name: 'Vector Spaces', status: 'not-started', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 2, notes: '', completedAt: null },
        ],
      },
    ],
  },
  {
    id: 'sub-physics',
    name: 'Physics',
    color: '#f43f5e',
    icon: 'Atom',
    order: 1,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    chapters: [
      {
        id: 'ch-mech',
        name: 'Mechanics',
        order: 0, tag: null, estimatedMarks: null,
        topics: [
          { id: 't8', name: 'Newton\'s Laws', status: 'revised', revisionCount: 3, lastRevised: daysAgo(1), nextRevisionDue: getDaysFromNow(14), order: 0, notes: '', completedAt: null },
          { id: 't9', name: 'Work & Energy', status: 'completed', revisionCount: 0, lastRevised: null, nextRevisionDue: getDaysFromNow(1), order: 1, notes: '', completedAt: null },
          { id: 't10', name: 'Rotational Motion', status: 'in-progress', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 2, notes: '', completedAt: null },
        ],
      },
      {
        id: 'ch-thermo',
        name: 'Thermodynamics',
        order: 1, tag: null, estimatedMarks: null,
        topics: [
          { id: 't11', name: 'Laws of Thermodynamics', status: 'completed', revisionCount: 1, lastRevised: daysAgo(4), nextRevisionDue: getDaysFromNow(3), order: 0, notes: '', completedAt: null },
          { id: 't12', name: 'Heat Transfer', status: 'not-started', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 1, notes: '', completedAt: null },
        ],
      },
    ],
  },
  {
    id: 'sub-chem',
    name: 'Chemistry',
    color: '#22c55e',
    icon: 'FlaskConical',
    order: 2,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    chapters: [
      {
        id: 'ch-organic',
        name: 'Organic Chemistry',
        order: 0, tag: null, estimatedMarks: null,
        topics: [
          { id: 't13', name: 'Hydrocarbons', status: 'revised', revisionCount: 2, lastRevised: daysAgo(1), nextRevisionDue: getDaysFromNow(7), order: 0, notes: '', completedAt: null },
          { id: 't14', name: 'Alcohols & Phenols', status: 'completed', revisionCount: 0, lastRevised: null, nextRevisionDue: getDaysFromNow(1), order: 1, notes: '', completedAt: null },
          { id: 't15', name: 'Aldehydes & Ketones', status: 'not-started', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 2, notes: '', completedAt: null },
        ],
      },
      {
        id: 'ch-inorganic',
        name: 'Inorganic Chemistry',
        order: 1, tag: null, estimatedMarks: null,
        topics: [
          { id: 't16', name: 'Periodic Table Trends', status: 'in-progress', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 0, notes: '', completedAt: null },
          { id: 't17', name: 'Chemical Bonding', status: 'not-started', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 1, notes: '', completedAt: null },
        ],
      },
    ],
  },
  {
    id: 'sub-cs',
    name: 'Computer Science',
    color: '#8b5cf6',
    icon: 'Code',
    order: 3,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    chapters: [
      {
        id: 'ch-dsa',
        name: 'Data Structures',
        order: 0, tag: null, estimatedMarks: null,
        topics: [
          { id: 't18', name: 'Arrays & Strings', status: 'revised', revisionCount: 3, lastRevised: daysAgo(1), nextRevisionDue: getDaysFromNow(14), order: 0, notes: '', completedAt: null },
          { id: 't19', name: 'Trees & Graphs', status: 'completed', revisionCount: 1, lastRevised: daysAgo(3), nextRevisionDue: getDaysFromNow(4), order: 1, notes: '', completedAt: null },
          { id: 't20', name: 'Dynamic Programming', status: 'in-progress', revisionCount: 0, lastRevised: null, nextRevisionDue: null, order: 2, notes: '', completedAt: null },
          { id: 't21', name: 'Sorting Algorithms', status: 'completed', revisionCount: 0, lastRevised: null, nextRevisionDue: getDaysFromNow(1), order: 3, notes: '', completedAt: null },
        ],
      },
    ],
  },
];

export const mockStudyBlocks: StudyBlock[] = [
  { id: 'sb1', date: getToday(), subjectId: 'sub-math', title: 'Integration Practice', startTime: '09:00', endTime: '10:30', priority: 'high', completed: false, notes: '' },
  { id: 'sb2', date: getToday(), subjectId: 'sub-physics', title: 'Rotational Motion Problems', startTime: '11:00', endTime: '12:00', priority: 'medium', completed: true, notes: '' },
  { id: 'sb3', date: getToday(), subjectId: 'sub-cs', title: 'DP Problem Set', startTime: '14:00', endTime: '15:30', priority: 'high', completed: false, notes: '' },
  { id: 'sb4', date: getToday(), subjectId: 'sub-chem', title: 'Organic Chemistry Review', startTime: '16:00', endTime: '17:00', priority: 'low', completed: false, notes: '' },
  { id: 'sb5', date: getDaysFromNow(1), subjectId: 'sub-math', title: 'Differential Equations Intro', startTime: '09:00', endTime: '10:00', priority: 'medium', completed: false, notes: '' },
  { id: 'sb6', date: getDaysFromNow(1), subjectId: 'sub-physics', title: 'Heat Transfer Chapter', startTime: '11:00', endTime: '12:30', priority: 'high', completed: false, notes: '' },
];

export const mockTasks: Task[] = [
  { id: 'task1', title: 'Complete integration worksheet', description: 'Solve problems 1-20 from Chapter 5', category: 'assignment', priority: 'high', completed: false, dueDate: getToday(), createdAt: daysAgo(2) + 'T10:00:00Z', completedAt: null },
  { id: 'task2', title: 'Review Newton\'s Laws notes', description: 'Go through class notes and highlight key formulas', category: 'revision', priority: 'medium', completed: true, dueDate: daysAgo(1), createdAt: daysAgo(3) + 'T08:00:00Z', completedAt: null },
  { id: 'task3', title: 'Practice sorting algorithms', description: 'Implement quicksort and mergesort from scratch', category: 'study', priority: 'high', completed: false, dueDate: getDaysFromNow(1), createdAt: daysAgo(1) + 'T12:00:00Z', completedAt: null },
  { id: 'task4', title: 'Chemistry lab report', description: 'Write up results from titration experiment', category: 'assignment', priority: 'urgent', completed: false, dueDate: getToday(), createdAt: daysAgo(4) + 'T09:00:00Z', completedAt: null },
  { id: 'task5', title: 'Read Chapter 7 - Eigenvalues', description: 'Read textbook and take notes', category: 'study', priority: 'medium', completed: false, dueDate: getDaysFromNow(2), createdAt: daysAgo(1) + 'T14:00:00Z', completedAt: null },
  { id: 'task6', title: 'Mock test preparation', description: 'Prepare for upcoming physics mock test', category: 'exam-prep', priority: 'high', completed: false, dueDate: getDaysFromNow(3), createdAt: new Date().toISOString(), completedAt: null },
];

export const mockActivities: ActivityEntry[] = [
  { id: 'a1', type: 'topic-completed', description: 'Completed "Sorting Algorithms"', timestamp: daysAgo(2) + 'T16:00:00Z', subjectId: 'sub-cs', color: '#8b5cf6' },
  { id: 'a2', type: 'topic-revised', description: 'Revised "Hydrocarbons" (Revision #2)', timestamp: daysAgo(1) + 'T10:00:00Z', subjectId: 'sub-chem', color: '#22c55e' },
  { id: 'a3', type: 'task-completed', description: 'Completed "Review Newton\'s Laws notes"', timestamp: daysAgo(1) + 'T15:00:00Z', color: '#f43f5e' },
  { id: 'a4', type: 'study-block-completed', description: 'Completed study block: Rotational Motion', timestamp: new Date().toISOString(), subjectId: 'sub-physics', color: '#f43f5e' },
  { id: 'a5', type: 'topic-revised', description: 'Revised "Arrays & Strings" (Revision #3)', timestamp: daysAgo(1) + 'T14:00:00Z', subjectId: 'sub-cs', color: '#8b5cf6' },
  { id: 'a6', type: 'topic-revised', description: 'Revised "Newton\'s Laws" (Revision #3)', timestamp: daysAgo(1) + 'T11:00:00Z', subjectId: 'sub-physics', color: '#f43f5e' },
  { id: 'a7', type: 'topic-completed', description: 'Completed "Alcohols & Phenols"', timestamp: daysAgo(2) + 'T14:00:00Z', subjectId: 'sub-chem', color: '#22c55e' },
];

export const mockDailyLogs: DailyLog[] = [
  { date: daysAgo(6), studyMinutes: 240, topicsCompleted: 2, tasksCompleted: 3, revisionsCompleted: 1 },
  { date: daysAgo(5), studyMinutes: 180, topicsCompleted: 1, tasksCompleted: 2, revisionsCompleted: 2 },
  { date: daysAgo(4), studyMinutes: 300, topicsCompleted: 3, tasksCompleted: 4, revisionsCompleted: 1 },
  { date: daysAgo(3), studyMinutes: 120, topicsCompleted: 1, tasksCompleted: 1, revisionsCompleted: 0 },
  { date: daysAgo(2), studyMinutes: 270, topicsCompleted: 2, tasksCompleted: 3, revisionsCompleted: 2 },
  { date: daysAgo(1), studyMinutes: 210, topicsCompleted: 1, tasksCompleted: 2, revisionsCompleted: 3 },
  { date: getToday(), studyMinutes: 60, topicsCompleted: 0, tasksCompleted: 0, revisionsCompleted: 0 },
];
