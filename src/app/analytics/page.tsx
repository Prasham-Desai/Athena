'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Filter,
  Download,
  Clock,
  BookOpen,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import {
  format,
  parseISO,
  subDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
} from 'date-fns';

import { useSubjectsStore } from '@/store/subjects-store';
import { useActivityStore } from '@/store/activity-store';
import { usePlannerStore } from '@/store/planner-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { getSubjectDisplayName } from '@/lib/subject-display';
import { useHydration } from '@/hooks/use-hydration';
import { cn } from '@/lib/utils';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoader } from '@/components/ui/loading';

import {
  DateRangePreset,
  getDateRangeBounds,
  calculateStreaks,
  calculateSubjectSummaries,
  exportStudyLogsToCSV,
} from '@/lib/analytics-calculations';

import { ContributionHeatmap } from '@/components/analytics/contribution-heatmap';
import { DailyStudyDetailsModal } from '@/components/analytics/daily-study-details-modal';
import { AnalyticsKPICards } from '@/components/analytics/analytics-kpi-cards';
import { StudyHoursChart } from '@/components/analytics/study-hours-chart';
import { SubjectCompletionChart } from '@/components/analytics/subject-completion-chart';
import { StudyConsistencyCard } from '@/components/analytics/study-consistency-card';
import { SubjectTimeAllocation } from '@/components/analytics/subject-time-allocation';
import { RevisionAnalytics } from '@/components/analytics/revision-analytics';
import { DailyActivityChart } from '@/components/analytics/daily-activity-chart';
import { AnalyticsHistoryTable } from '@/components/analytics/analytics-history-table';

export default function AnalyticsPage() {
  const hydrated = useHydration();

  // Stores
  const subjects = useSubjectsStore((s) => s.subjects);
  const fetchSubjects = useSubjectsStore((s) => s.fetchSubjects);

  const { dailyLogs, activities, fetchDailyLogs, fetchActivities } = useActivityStore();
  const { studyBlocks, fetchStudyBlocks } = usePlannerStore();
  const { settings, fetchSettings } = useSettingsStore();
  const activeYearId = useAcademicYearStore((s) => s.activeYearId);

  // Initial data fetching
  useEffect(() => {
    fetchDailyLogs('all');
    fetchSubjects('all');
    fetchActivities('all');
    fetchStudyBlocks('all');
    fetchSettings();
  }, [activeYearId, fetchDailyLogs, fetchSubjects, fetchActivities, fetchStudyBlocks, fetchSettings]);

  // Date range filter
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('this-year');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  // Subject filter for overall view
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Daily drill-down modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Calculate current date range bounds
  const { start: startDateStr, end: endDateStr } = useMemo(() => {
    return getDateRangeBounds(rangePreset, customStart, customEnd, dailyLogs);
  }, [rangePreset, customStart, customEnd, dailyLogs]);

  // Filter daily logs in selected range
  const logsInRange = useMemo(() => {
    return dailyLogs.filter((log) => {
      return log.date >= startDateStr && log.date <= endDateStr;
    });
  }, [dailyLogs, startDateStr, endDateStr]);

  // Previous period comparison computation
  const prevPeriodComparison = useMemo(() => {
    try {
      const curStart = parseISO(startDateStr);
      const curEnd = parseISO(endDateStr);
      const spanDays = Math.max(1, differenceInCalendarDays(curEnd, curStart) + 1);

      const prevEnd = subDays(curStart, 1);
      const prevStart = subDays(prevEnd, spanDays - 1);

      const prevStartStr = format(prevStart, 'yyyy-MM-dd');
      const prevEndStr = format(prevEnd, 'yyyy-MM-dd');

      const prevLogs = dailyLogs.filter(
        (l) => l.date >= prevStartStr && l.date <= prevEndStr
      );

      const curHours = logsInRange.reduce((sum, l) => sum + l.studyMinutes, 0) / 60;
      const prevHours = prevLogs.reduce((sum, l) => sum + l.studyMinutes, 0) / 60;

      const curTopics = logsInRange.reduce((sum, l) => sum + l.topicsCompleted, 0);
      const prevTopics = prevLogs.reduce((sum, l) => sum + l.topicsCompleted, 0);

      const curRevisions = logsInRange.reduce((sum, l) => sum + l.revisionsCompleted, 0);
      const prevRevisions = prevLogs.reduce((sum, l) => sum + l.revisionsCompleted, 0);

      const calcPct = (cur: number, prev: number) => {
        if (prev === 0) return cur > 0 ? 100 : 0;
        return Math.round(((cur - prev) / prev) * 100);
      };

      return {
        hoursPercentChange: calcPct(curHours, prevHours),
        topicsPercentChange: calcPct(curTopics, prevTopics),
        revisionsPercentChange: calcPct(curRevisions, prevRevisions),
      };
    } catch {
      return undefined;
    }
  }, [startDateStr, endDateStr, logsInRange, dailyLogs]);

  // Subject attribution map
  const blocksByDate = useMemo(() => {
    const map = new Map<string, typeof studyBlocks>();
    studyBlocks.forEach((b) => {
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    });
    return map;
  }, [studyBlocks]);

  // Filtered stats by subject if a subject filter is applied
  const { totalHours, topicsCompleted, revisionsDone, activeDaysCount } = useMemo(() => {
    let hoursMins = 0;
    let topics = 0;
    let revisions = 0;
    let activeDays = 0;

    logsInRange.forEach((log) => {
      let dayMins = log.studyMinutes || 0;
      let dayTopics = log.topicsCompleted || 0;
      let dayRevisions = log.revisionsCompleted || 0;

      if (selectedSubjectId !== 'all') {
        const dayBlocks = blocksByDate.get(log.date) || [];
        const matchesSubject = dayBlocks.some((b) => b.subjectId === selectedSubjectId);
        const hasSession = log.sessions?.some((s) => {
          const b = studyBlocks.find((sb) => sb.id === s.studyBlockId);
          return b?.subjectId === selectedSubjectId;
        });

        if (!matchesSubject && !hasSession) {
          dayMins = 0;
        }
      }

      if (dayMins > 0 || dayTopics > 0 || dayRevisions > 0) {
        activeDays++;
      }
      hoursMins += dayMins;
      topics += dayTopics;
      revisions += dayRevisions;
    });

    return {
      totalHours: hoursMins / 60,
      topicsCompleted: topics,
      revisionsDone: revisions,
      activeDaysCount: activeDays,
    };
  }, [logsInRange, selectedSubjectId, blocksByDate, studyBlocks]);

  // Total calendar days in selected period
  const totalCalendarDays = useMemo(() => {
    try {
      const s = parseISO(startDateStr);
      const e = parseISO(endDateStr);
      return Math.max(1, differenceInCalendarDays(e, s) + 1);
    } catch {
      return 1;
    }
  }, [startDateStr, endDateStr]);

  const avgHoursPerCalendarDay = totalCalendarDays > 0 ? totalHours / totalCalendarDays : 0;
  const avgHoursPerActiveDay = activeDaysCount > 0 ? totalHours / activeDaysCount : 0;

  // Streak Stats
  const streakStats = useMemo(() => {
    const activeDates = dailyLogs
      .filter((l) => l.studyMinutes > 0 || l.topicsCompleted > 0 || l.revisionsCompleted > 0)
      .map((l) => l.date);
    return calculateStreaks(activeDates);
  }, [dailyLogs]);

  // Subject Summaries
  const subjectSummaries = useMemo(() => {
    return calculateSubjectSummaries(subjects, dailyLogs, studyBlocks);
  }, [subjects, dailyLogs, studyBlocks]);

  // Handle date selection for modal
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    exportStudyLogsToCSV(dailyLogs, subjects, studyBlocks);
  };

  if (!hydrated) {
    return <PageLoader label="Loading study analytics" variant="analytics" />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* Section A: Page Header & Global Controls */}
      {/* ------------------------------------------------------------------ */}
      <PageHeader
        title="Analytics"
        description="Your progress is inspiring — look how far you've come! 📈"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Subject Filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] pointer-events-none" />
            <select
              aria-label="Filter entire analytics by subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-9 pl-8 pr-3 text-xs rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {getSubjectDisplayName(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center rounded-xl bg-[hsl(var(--muted))] p-1 text-xs">
            {(
              [
                { id: 'this-week', label: 'Week' },
                { id: 'this-month', label: 'Month' },
                { id: 'this-year', label: 'Year' },
                { id: 'all-time', label: 'All Time' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setRangePreset(item.id);
                  setShowCustomPicker(false);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 font-medium transition-all',
                  rangePreset === item.id && !showCustomPicker
                    ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 font-medium transition-all flex items-center gap-1',
                rangePreset === 'custom' || showCustomPicker
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xs'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
              title="Custom date range"
            >
              <CalendarIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Custom</span>
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="h-9 px-3 text-xs font-medium rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Export all study logs to CSV"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </PageHeader>

      {/* Custom Date Range Picker Accordion */}
      {showCustomPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-[hsl(var(--muted-foreground))]">From:</span>
            <input
              type="date"
              value={customStart || startDateStr}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setRangePreset('custom');
              }}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[hsl(var(--muted-foreground))]">To:</span>
            <input
              type="date"
              value={customEnd || endDateStr}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setRangePreset('custom');
              }}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2.5 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none"
            />
          </div>
          <button
            onClick={() => {
              setRangePreset('custom');
              setShowCustomPicker(false);
            }}
            className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold px-3 py-1.5 border border-emerald-500/30 transition-colors"
          >
            Apply Range
          </button>
        </motion.div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section B: KPI Summary Cards */}
      {/* ------------------------------------------------------------------ */}
      <AnalyticsKPICards
        totalHours={totalHours}
        topicsCompleted={topicsCompleted}
        revisionsDone={revisionsDone}
        avgHoursPerCalendarDay={avgHoursPerCalendarDay}
        avgHoursPerActiveDay={avgHoursPerActiveDay}
        activeDaysCount={activeDaysCount}
        totalCalendarDays={totalCalendarDays}
        prevPeriodComparison={prevPeriodComparison}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Section C: GitHub-Style Multi-Year Contribution Heatmap */}
      {/* ------------------------------------------------------------------ */}
      <ContributionHeatmap
        dailyLogs={dailyLogs}
        subjects={subjects}
        studyBlocks={studyBlocks}
        dailyGoalHours={settings.dailyStudyGoalHours || 6}
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Section D & E: Study Trends & Subject Completion */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <StudyHoursChart
          dailyLogs={dailyLogs}
          startDateStr={startDateStr}
          endDateStr={endDateStr}
        />

        <SubjectCompletionChart summaries={subjectSummaries} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section F: Additional Study Intelligence */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StudyConsistencyCard stats={streakStats} dailyLogs={dailyLogs} />
        <SubjectTimeAllocation summaries={subjectSummaries} />
        <RevisionAnalytics
          summaries={subjectSummaries}
          totalRevisionsCount={revisionsDone || streakStats.totalActiveDays}
        />
      </div>

      {/* Daily Activity Stacked Chart */}
      <DailyActivityChart
        dailyLogs={dailyLogs}
        startDateStr={startDateStr}
        endDateStr={endDateStr}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Section G: Detailed Daily History Table */}
      {/* ------------------------------------------------------------------ */}
      <AnalyticsHistoryTable
        dailyLogs={dailyLogs}
        subjects={subjects}
        studyBlocks={studyBlocks}
        onSelectDate={handleSelectDate}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Clickable Daily Drill-Down Modal */}
      {/* ------------------------------------------------------------------ */}
      <DailyStudyDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dateStr={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        dailyLogs={dailyLogs}
        subjects={subjects}
        studyBlocks={studyBlocks}
        activities={activities}
        dailyGoalHours={settings.dailyStudyGoalHours || 6}
      />
    </div>
  );
}
