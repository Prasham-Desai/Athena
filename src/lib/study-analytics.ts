import type { StudyBlock, StudySession, Task } from '@/types';

/**
 * Calculates duration in minutes from HH:mm start and end times.
 * Handles same-day and overnight (cross-midnight) intervals cleanly.
 */
export function calculateMinutesFromRange(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

/**
 * Formats minutes into human-friendly "Xh Ym" or "Ym".
 */
export function formatDurationHuman(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
}

/**
 * Checks if a candidate manual study log interval [startTime, endTime] on `date`
 * overlaps with any recorded timer sessions on that date.
 */
export function checkIntervalOverlap(
  date: string,
  startTime: string, // "HH:mm"
  endTime: string,   // "HH:mm"
  sessions: StudySession[] = []
): { hasOverlap: boolean; overlapMinutes: number; overlappingSessionTitle?: string } {
  if (!startTime || !endTime || !sessions.length) {
    return { hasOverlap: false, overlapMinutes: 0 };
  }

  const [candSh, candSm] = startTime.split(':').map(Number);
  const [candEh, candEm] = endTime.split(':').map(Number);
  if (isNaN(candSh) || isNaN(candSm) || isNaN(candEh) || isNaN(candEm)) {
    return { hasOverlap: false, overlapMinutes: 0 };
  }

  let candStart = candSh * 60 + candSm;
  let candEnd = candEh * 60 + candEm;
  if (candEnd < candStart) candEnd += 24 * 60; // overnight handling

  let totalOverlap = 0;
  let conflictingTitle: string | undefined;

  for (const session of sessions) {
    // Only compare against non-break sessions
    if (session.type === 'break') continue;

    // Determine start and end minute of the session in local day minutes
    const sStart = new Date(session.startTime);
    const sEnd = new Date(session.endTime);
    if (isNaN(sStart.getTime()) || isNaN(sEnd.getTime())) continue;

    const sessStart = sStart.getHours() * 60 + sStart.getMinutes();
    let sessEnd = sEnd.getHours() * 60 + sEnd.getMinutes();
    if (sessEnd < sessStart) sessEnd += 24 * 60;

    // Overlap interval: [max(startA, startB), min(endA, endB)]
    const overlapStart = Math.max(candStart, sessStart);
    const overlapEnd = Math.min(candEnd, sessEnd);

    if (overlapEnd > overlapStart) {
      const diff = overlapEnd - overlapStart;
      totalOverlap += diff;
      if (!conflictingTitle) {
        conflictingTitle = session.title || 'Timer Session';
      }
    }
  }

  return {
    hasOverlap: totalOverlap > 0,
    overlapMinutes: totalOverlap,
    overlappingSessionTitle: conflictingTitle,
  };
}

/**
 * Computes deduplicated actual study time across timer sessions and manual study logs.
 * Uses a 1440-minute day bitmap union so that overlapping minutes between a timer session
 * and a manual study log are never double counted.
 */
export function calculateDayStudyMetrics({
  date,
  studyBlocks = [],
  sessions = [],
  tasks = [],
}: {
  date: string;
  studyBlocks: StudyBlock[];
  sessions: StudySession[];
  tasks: Task[];
}) {
  const dayBlocks = studyBlocks.filter((b) => b.date === date);
  const dayTasks = tasks.filter((t) => t.date === date);

  // Minute occupancy map for the 24 hours of the day (0 to 1439)
  const minuteSet = new Set<number>();

  let rawTimerMinutes = 0;
  let rawManualMinutes = 0;
  let standaloneManualMinutes = 0;

  // 1. Process Timer Sessions
  for (const session of sessions) {
    if (session.type === 'break') continue;
    const dur = Number(session.durationMinutes) || 0;

    if (session.type === 'manual') {
      standaloneManualMinutes += dur;
    } else {
      rawTimerMinutes += dur;

      const sStart = new Date(session.startTime);
      const sEnd = new Date(session.endTime);
      if (!isNaN(sStart.getTime()) && !isNaN(sEnd.getTime())) {
        const sessStart = sStart.getHours() * 60 + sStart.getMinutes();
        let sessEnd = sEnd.getHours() * 60 + sEnd.getMinutes();
        if (sessEnd < sessStart) sessEnd += 24 * 60;
        for (let m = sessStart; m < sessEnd && m < 1440; m++) {
          minuteSet.add(m);
        }
      }
    }
  }

  // 2. Process Manual Study Logs (Study Blocks)
  for (const block of dayBlocks) {
    const dur = block.durationMinutes ?? calculateMinutesFromRange(block.startTime, block.endTime);
    rawManualMinutes += dur;

    if (block.startTime && block.endTime) {
      const [sh, sm] = block.startTime.split(':').map(Number);
      const [eh, em] = block.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let bStart = sh * 60 + sm;
        let bEnd = eh * 60 + em;
        if (bEnd < bStart) bEnd += 24 * 60;
        for (let m = bStart; m < bEnd && m < 1440; m++) {
          minuteSet.add(m);
        }
      }
    }
  }

  // Deduplicated time: timer/block intervals + any manual additions
  const timedMinutes = minuteSet.size > 0 ? minuteSet.size : (rawTimerMinutes + rawManualMinutes);
  const deduplicatedMinutes = timedMinutes + standaloneManualMinutes;

  const overlappingMinutes = Math.max(0, (rawTimerMinutes + rawManualMinutes) - timedMinutes);

  const completedTasksCount = dayTasks.filter((t) => t.completed).length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return {
    completedTasksCount,
    totalTasksTodayCount: dayTasks.length,
    pendingTasksCount,
    studyLogsCount: dayBlocks.length,
    rawManualMinutes,
    rawTimerMinutes,
    actualStudyMinutes: deduplicatedMinutes,
    overlappingMinutes,
  };
}
