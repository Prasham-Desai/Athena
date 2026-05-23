import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function getDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date(getToday());
}

export function isToday(date: string | null): boolean {
  if (!date) return false;
  return date === getToday();
}

export function getRelativeDate(date: string): string {
  const today = new Date(getToday());
  const target = new Date(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return formatDate(date);
}

export function getSpacedRepetitionDate(revisionCount: number): string {
  // Spaced repetition intervals: 1, 3, 7, 14, 30, 60 days
  const intervals = [1, 3, 7, 14, 30, 60];
  const interval = intervals[Math.min(revisionCount, intervals.length - 1)];
  return getDaysFromNow(interval);
}

export function getStudyMinutes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

export function getStreakCount(dailyLogs: { date: string; studyMinutes: number }[]): number {
  const today = getToday();
  const sorted = [...dailyLogs]
    .filter(l => l.studyMinutes > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (sorted.length === 0) return 0;
  
  let streak = 0;
  let checkDate = new Date(today);
  
  // Check if today has a log, if not start from yesterday
  if (sorted[0]?.date !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (sorted[0]?.date !== checkDate.toISOString().split('T')[0]) {
      return 0;
    }
  }
  
  for (const log of sorted) {
    const expected = checkDate.toISOString().split('T')[0];
    if (log.date === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (log.date < expected) {
      break;
    }
  }
  
  return streak;
}

// Subject color palette
export const SUBJECT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
];

export const SUBJECT_ICONS = [
  'BookOpen', 'Calculator', 'Atom', 'Globe', 'Code', 'Palette',
  'Music', 'FlaskConical', 'Scale', 'Languages', 'Brain', 'Lightbulb',
  'GraduationCap', 'Microscope', 'Compass', 'PenTool',
];

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#22c55e', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  medium: { label: 'Medium', color: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  high: { label: 'High', color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-500' },
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-500' },
};

export const STATUS_CONFIG = {
  'not-started': { label: 'Not Started', color: '#6b7280', bg: 'bg-gray-500/10', text: 'text-gray-500' },
  'in-progress': { label: 'In Progress', color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  'completed': { label: 'Completed', color: '#22c55e', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  'revised': { label: 'Revised', color: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-500' },
};

export const IMPORTANCE_TAG_CONFIG: Record<string, { label: string; description: string; bg: string; text: string; border: string }> = {
  'low':         { label: 'Low',         description: 'Low weightage', bg: 'bg-emerald-500/10',    text: 'text-emerald-400',    border: 'border-emerald-500/30' },
  'med':         { label: 'Medium',      description: 'Medium weightage', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'high':        { label: 'High',        description: 'High weightage', bg: 'bg-orange-500/10',   text: 'text-orange-400',   border: 'border-orange-500/30' },
  'very-high':   { label: 'Very High',   description: 'Must know topics', bg: 'bg-red-500/10',   text: 'text-red-400',   border: 'border-red-500/30' },
};
