import {
  format,
  parseISO,
  isBefore,
  isAfter,
  addDays,
  subDays,
  differenceInCalendarDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import type { DailyLog, StudySession, Subject, ActivityEntry, StudyBlock, Task } from '@/types';

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

export type HeatmapMetric = 'hours' | 'topics' | 'revisions';
export type DateRangePreset = 'this-week' | 'this-month' | 'this-year' | 'all-time' | 'custom';
export type AggregationPeriod = 'daily' | 'weekly' | 'monthly';

export interface CalendarDayCell {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weekIndex: number; // 0 to 53
  month: number; // 0 to 11
  isFuture: boolean;
  studyMinutes: number;
  studyHours: number;
  topicsCompleted: number;
  revisionsCompleted: number;
  tasksCompleted: number;
  sessionsCount: number;
  subjectsStudied: string[];
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface MonthHeaderLabel {
  monthName: string;
  shortName: string;
  weekColumn: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  consistencyRate: number; // Percentage (0-100)
  studyDayFrequency: number; // Average active days per week (0-7)
  mostProductiveDay: {
    date: string;
    hours: number;
    sessions: number;
  } | null;
}

export interface SubjectAnalyticsSummary {
  subjectId: string;
  name: string;
  color: string;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  revisedTopics: number;
  completionPercent: number;
  revisionCoveragePercent: number;
  studyMinutes: number;
  studyHours: number;
  timeSharePercent: number;
}

// ---------------------------------------------------------------------------
// Leap Year & Day Generation
// ---------------------------------------------------------------------------

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Generates an array of all dates (YYYY-MM-DD) for a given calendar year.
 * Jan 1 through Dec 31 inclusive, with Feb 29 on leap years.
 */
export function generateYearDates(year: number): string[] {
  const dates: string[] = [];
  const totalDays = getDaysInYear(year);

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(year, 0, 1 + i);
    dates.push(format(d, 'yyyy-MM-dd'));
  }
  return dates;
}

/**
 * Calculates intensity level 0-4 based on value and selected metric.
 */
export function calculateIntensityLevel(
  value: number,
  metric: HeatmapMetric
): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0) return 0;

  switch (metric) {
    case 'hours':
      if (value < 1.0) return 1;
      if (value < 2.5) return 2;
      if (value < 4.5) return 3;
      return 4;

    case 'topics':
      if (value <= 1) return 1;
      if (value <= 3) return 2;
      if (value <= 6) return 3;
      return 4;

    case 'revisions':
      if (value <= 1) return 1;
      if (value <= 2) return 2;
      if (value <= 4) return 3;
      return 4;

    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// GitHub-Style Heatmap Grid Generator
// ---------------------------------------------------------------------------

export interface YearHeatmapGrid {
  year: number;
  columns: (CalendarDayCell | null)[][]; // 53 or 54 columns of 7 rows (row 0 = Sun, row 6 = Sat)
  monthHeaders: MonthHeaderLabel[];
  totalDays: number;
  activeDaysCount: number;
  totalHours: number;
  totalTopics: number;
  totalRevisions: number;
}

/**
 * Generates a full GitHub contribution calendar grid for a given year.
 * Respects real logs, subject filtering, and metric selection.
 */
export function generateHeatmapGrid({
  year,
  dailyLogs,
  metric = 'hours',
  filterSubjectId,
  subjects = [],
  studyBlocks = [],
  todayStr = format(new Date(), 'yyyy-MM-dd'),
}: {
  year: number;
  dailyLogs: DailyLog[];
  metric?: HeatmapMetric;
  filterSubjectId?: string;
  subjects?: Subject[];
  studyBlocks?: StudyBlock[];
  todayStr?: string;
}): YearHeatmapGrid {
  const dates = generateYearDates(year);
  const logsMap = new Map<string, DailyLog>();
  dailyLogs.forEach((l) => logsMap.set(l.date, l));

  // Map study blocks by date and subject for subject filtering & identification
  const blocksByDate = new Map<string, StudyBlock[]>();
  studyBlocks.forEach((b) => {
    const list = blocksByDate.get(b.date) || [];
    list.push(b);
    blocksByDate.set(b.date, list);
  });

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  // Build cells for every day of the year
  const jan1 = new Date(year, 0, 1);
  const jan1DayOfWeek = jan1.getDay(); // 0 = Sun, 6 = Sat

  // GitHub layout: 7 rows (0 = Sun, ..., 6 = Sat).
  // Column index starts at 0. Jan 1 is in column 0 at row = jan1DayOfWeek.
  const columns: (CalendarDayCell | null)[][] = [];
  let currentColumn: (CalendarDayCell | null)[] = [];

  // Pad days in week 0 before Jan 1 with null
  for (let i = 0; i < jan1DayOfWeek; i++) {
    currentColumn.push(null);
  }

  const monthHeaders: MonthHeaderLabel[] = [];
  let lastSeenMonth = -1;

  let totalHours = 0;
  let totalTopics = 0;
  let totalRevisions = 0;
  let activeDaysCount = 0;

  dates.forEach((dateStr) => {
    const log = logsMap.get(dateStr);
    const dayBlocks = blocksByDate.get(dateStr) || [];
    const dateObj = parseISO(dateStr);
    const dayOfWeek = dateObj.getDay();
    const month = dateObj.getMonth();

    const isFuture = dateStr > todayStr;

    // Determine subjects studied on this date
    const daySubjectsSet = new Set<string>();
    dayBlocks.forEach((b) => {
      const s = subjectMap.get(b.subjectId);
      if (s) daySubjectsSet.add(s.name);
    });

    // Check sessions on this date
    if (log?.sessions) {
      log.sessions.forEach((sess) => {
        if (sess.studyBlockId) {
          const b = studyBlocks.find((sb) => sb.id === sess.studyBlockId);
          if (b && subjectMap.has(b.subjectId)) {
            daySubjectsSet.add(subjectMap.get(b.subjectId)!.name);
          }
        }
      });
    }

    // Calculate metrics for this day, with optional subject filter
    let dayStudyMinutes = log?.studyMinutes || 0;
    let dayTopics = log?.topicsCompleted || 0;
    let dayRevisions = log?.revisionsCompleted || 0;
    const dayTasks = log?.tasksCompleted || 0;
    const sessionsCount = log?.sessions?.length || (dayStudyMinutes > 0 ? 1 : 0);

    // If filtered by subject, adjust day metrics
    if (filterSubjectId) {
      const isSubjectStudied = dayBlocks.some((b) => b.subjectId === filterSubjectId);
      const hasSubjectSession = log?.sessions?.some((s) => {
        const b = studyBlocks.find((sb) => sb.id === s.studyBlockId);
        return b?.subjectId === filterSubjectId;
      });

      if (!isSubjectStudied && !hasSubjectSession) {
        dayStudyMinutes = 0;
      }
    }

    const dayStudyHours = dayStudyMinutes / 60;

    // Metric evaluation value for intensity
    let metricValue = 0;
    if (metric === 'hours') metricValue = dayStudyHours;
    else if (metric === 'topics') metricValue = dayTopics;
    else if (metric === 'revisions') metricValue = dayRevisions;

    const intensity = isFuture ? 0 : calculateIntensityLevel(metricValue, metric);

    if (dayStudyMinutes > 0 || dayTopics > 0 || dayRevisions > 0) {
      activeDaysCount++;
    }
    totalHours += dayStudyHours;
    totalTopics += dayTopics;
    totalRevisions += dayRevisions;

    const cell: CalendarDayCell = {
      date: dateStr,
      dayOfWeek,
      weekIndex: columns.length,
      month,
      isFuture,
      studyMinutes: dayStudyMinutes,
      studyHours: dayStudyHours,
      topicsCompleted: dayTopics,
      revisionsCompleted: dayRevisions,
      tasksCompleted: dayTasks,
      sessionsCount,
      subjectsStudied: Array.from(daySubjectsSet),
      intensity,
    };

    currentColumn.push(cell);

    // Track month header label position
    if (month !== lastSeenMonth) {
      monthHeaders.push({
        monthName: format(dateObj, 'MMMM'),
        shortName: format(dateObj, 'MMM'),
        weekColumn: columns.length,
      });
      lastSeenMonth = month;
    }

    // If column reaches 7 rows (Saturday), push to columns and start a new column
    if (currentColumn.length === 7) {
      columns.push(currentColumn);
      currentColumn = [];
    }
  });

  // If there's an incomplete column at the end of the year, pad with null
  if (currentColumn.length > 0) {
    while (currentColumn.length < 7) {
      currentColumn.push(null);
    }
    columns.push(currentColumn);
  }

  return {
    year,
    columns,
    monthHeaders,
    totalDays: dates.length,
    activeDaysCount,
    totalHours: Number(totalHours.toFixed(1)),
    totalTopics,
    totalRevisions,
  };
}

// ---------------------------------------------------------------------------
// Streak & Consistency Engine
// ---------------------------------------------------------------------------

export function calculateStreaks(
  activeDates: string[],
  todayStr = format(new Date(), 'yyyy-MM-dd')
): StreakStats {
  if (!activeDates.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      consistencyRate: 0,
      studyDayFrequency: 0,
      mostProductiveDay: null,
    };
  }

  // Deduplicate and sort dates ascending
  const uniqueDates = Array.from(new Set(activeDates))
    .filter((d) => d <= todayStr) // Do not include future dates in streak
    .sort();

  if (!uniqueDates.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      consistencyRate: 0,
      studyDayFrequency: 0,
      mostProductiveDay: null,
    };
  }

  const dateSet = new Set(uniqueDates);

  // 1. Longest streak calculation
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dStr of uniqueDates) {
    const curDate = parseISO(dStr);
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diff = differenceInCalendarDays(curDate, prevDate);
      if (diff === 1) {
        currentRun += 1;
      } else if (diff > 1) {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = curDate;
  }

  // 2. Current streak calculation
  // A streak is active if today was studied, OR if yesterday was studied and today hasn't passed yet.
  let currentStreak = 0;
  const today = parseISO(todayStr);
  const yesterday = subDays(today, 1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

  let checkDate: Date | null = null;
  if (dateSet.has(todayStr)) {
    checkDate = today;
  } else if (dateSet.has(yesterdayStr)) {
    checkDate = yesterday;
  }

  if (checkDate) {
    while (dateSet.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  // 3. Consistency Rate & Frequency
  // Days elapsed from earliest study date to today
  const earliestDate = parseISO(uniqueDates[0]);
  const totalSpanDays = Math.max(1, differenceInCalendarDays(today, earliestDate) + 1);
  const totalActiveDays = uniqueDates.length;
  const consistencyRate = Math.min(100, Math.round((totalActiveDays / totalSpanDays) * 100));

  const totalWeeks = Math.max(1, totalSpanDays / 7);
  const studyDayFrequency = Number((totalActiveDays / totalWeeks).toFixed(1));

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    consistencyRate,
    studyDayFrequency,
    mostProductiveDay: null,
  };
}

// ---------------------------------------------------------------------------
// Date Range Helper
// ---------------------------------------------------------------------------

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
  allLogs: DailyLog[] = []
): { start: string; end: string } {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  switch (preset) {
    case 'this-week':
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: todayStr,
      };

    case 'this-month':
      return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: todayStr,
      };

    case 'this-year':
      return {
        start: format(startOfYear(today), 'yyyy-MM-dd'),
        end: todayStr,
      };

    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return {
        start: format(subDays(today, 30), 'yyyy-MM-dd'),
        end: todayStr,
      };

    case 'all-time':
    default:
      if (allLogs.length > 0) {
        const sorted = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));
        return {
          start: sorted[0].date,
          end: todayStr,
        };
      }
      return {
        start: format(startOfYear(today), 'yyyy-MM-dd'),
        end: todayStr,
      };
  }
}

// ---------------------------------------------------------------------------
// Subject Completion & Time Allocation
// ---------------------------------------------------------------------------

export function calculateSubjectSummaries(
  subjects: Subject[],
  dailyLogs: DailyLog[] = [],
  studyBlocks: StudyBlock[] = []
): SubjectAnalyticsSummary[] {
  // Aggregate total minutes across all logs
  const subjectMinutesMap = new Map<string, number>();

  studyBlocks.forEach((block) => {
    const mins = block.durationMinutes || 0;
    subjectMinutesMap.set(block.subjectId, (subjectMinutesMap.get(block.subjectId) || 0) + mins);
  });

  const totalCurriculumStudyMinutes = Array.from(subjectMinutesMap.values()).reduce((a, b) => a + b, 0);

  return subjects.map((subject) => {
    let totalTopics = 0;
    let completedTopics = 0;
    let revisedTopics = 0;

    subject.chapters.forEach((chapter) => {
      chapter.topics.forEach((topic) => {
        totalTopics++;
        if (topic.status === 'completed' || topic.status === 'revised') {
          completedTopics++;
        }
        if (topic.revisionCount > 0 || topic.status === 'revised') {
          revisedTopics++;
        }
      });
    });

    const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const revisionCoveragePercent = totalTopics > 0 ? Math.round((revisedTopics / totalTopics) * 100) : 0;
    const remainingTopics = Math.max(0, totalTopics - completedTopics);

    const studyMinutes = subjectMinutesMap.get(subject.id) || 0;
    const studyHours = Number((studyMinutes / 60).toFixed(1));
    const timeSharePercent =
      totalCurriculumStudyMinutes > 0
        ? Math.round((studyMinutes / totalCurriculumStudyMinutes) * 100)
        : 0;

    return {
      subjectId: subject.id,
      name: subject.name,
      color: subject.color || '#3b82f6',
      totalTopics,
      completedTopics,
      remainingTopics,
      revisedTopics,
      completionPercent,
      revisionCoveragePercent,
      studyMinutes,
      studyHours,
      timeSharePercent,
    };
  });
}

// ---------------------------------------------------------------------------
// CSV Export Generator
// ---------------------------------------------------------------------------

export function exportStudyLogsToCSV(
  dailyLogs: DailyLog[],
  subjects: Subject[] = [],
  studyBlocks: StudyBlock[] = []
): void {
  if (typeof window === 'undefined') return;

  const subjectMap = new Map<string, string>();
  subjects.forEach((s) => subjectMap.set(s.id, s.name));

  const blocksByDate = new Map<string, StudyBlock[]>();
  studyBlocks.forEach((b) => {
    const list = blocksByDate.get(b.date) || [];
    list.push(b);
    blocksByDate.set(b.date, list);
  });

  const sortedLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));

  const headers = [
    'Date',
    'Day of Week',
    'Study Duration (Formatted)',
    'Study Hours',
    'Study Minutes',
    'Sessions Count',
    'Topics Completed',
    'Tasks Completed',
    'Revisions Completed',
    'Subjects Studied',
  ];

  const rows = sortedLogs.map((log) => {
    const d = parseISO(log.date);
    const dayName = format(d, 'EEEE');
    const hours = (log.studyMinutes / 60).toFixed(2);
    const h = Math.floor(log.studyMinutes / 60);
    const m = log.studyMinutes % 60;
    const formattedDuration = `${h}h ${m}m`;

    const dayBlocks = blocksByDate.get(log.date) || [];
    const subjectsStudied = Array.from(
      new Set(dayBlocks.map((b) => subjectMap.get(b.subjectId)).filter(Boolean))
    ).join('; ');

    const sessionsCount = log.sessions?.length || (log.studyMinutes > 0 ? 1 : 0);

    return [
      log.date,
      dayName,
      `"${formattedDuration}"`,
      hours,
      log.studyMinutes,
      sessionsCount,
      log.topicsCompleted,
      log.tasksCompleted,
      log.revisionsCompleted,
      `"${subjectsStudied || 'General'}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `athena-study-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
