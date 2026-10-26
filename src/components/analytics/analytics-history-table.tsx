'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  Clock,
  BookOpen,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DailyLog, Subject, StudyBlock } from '@/types';
import { exportStudyLogsToCSV } from '@/lib/analytics-calculations';
import { cn } from '@/lib/utils';

interface AnalyticsHistoryTableProps {
  dailyLogs: DailyLog[];
  subjects: Subject[];
  studyBlocks?: StudyBlock[];
  onSelectDate: (date: string) => void;
}

type SortField = 'date' | 'duration' | 'topics' | 'revisions';
type SortOrder = 'asc' | 'desc';

export function AnalyticsHistoryTable({
  dailyLogs,
  subjects,
  studyBlocks = [],
  onSelectDate,
}: AnalyticsHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const blocksByDate = useMemo(() => {
    const map = new Map<string, StudyBlock[]>();
    studyBlocks.forEach((b) => {
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    });
    return map;
  }, [studyBlocks]);

  // Filter & Search
  const filteredLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();

      // Match date
      if (log.date.includes(lower)) return true;

      // Match formatted date
      try {
        const formatted = format(parseISO(log.date), 'MMMM d yyyy EEEE').toLowerCase();
        if (formatted.includes(lower)) return true;
      } catch {}

      // Match subjects studied
      const blocks = blocksByDate.get(log.date) || [];
      const matchSubject = blocks.some((b) => {
        const s = subjectMap.get(b.subjectId);
        return s?.name.toLowerCase().includes(lower);
      });
      if (matchSubject) return true;

      return false;
    });
  }, [dailyLogs, searchTerm, blocksByDate, subjectMap]);

  // Sort
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let comp = 0;
      if (sortField === 'date') {
        comp = a.date.localeCompare(b.date);
      } else if (sortField === 'duration') {
        comp = a.studyMinutes - b.studyMinutes;
      } else if (sortField === 'topics') {
        comp = a.topicsCompleted - b.topicsCompleted;
      } else if (sortField === 'revisions') {
        comp = a.revisionsCompleted - b.revisionsCompleted;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredLogs, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const currentPageLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleExportCSV = () => {
    exportStudyLogsToCSV(dailyLogs, subjects, studyBlocks);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6 shadow-sm"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Study History Records ({sortedLogs.length})
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Historical log of daily study durations, sessions, and academic events
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search date or subject..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-8 w-44 sm:w-56 pl-8 pr-3 text-xs rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-medium rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--card))] text-[hsl(var(--foreground))] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV report"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <th
                onClick={() => handleSort('date')}
                className="pb-3 font-semibold cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('duration')}
                className="pb-3 font-semibold cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Duration</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="pb-3 font-semibold">Sessions</th>
              <th className="pb-3 font-semibold">Subjects Studied</th>
              <th
                onClick={() => handleSort('topics')}
                className="pb-3 font-semibold cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Topics</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('revisions')}
                className="pb-3 font-semibold cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Revisions</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="pb-3 font-semibold text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]/50">
            {currentPageLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
                  No study logs found matching your query.
                </td>
              </tr>
            ) : (
              currentPageLogs.map((log) => {
                const dateObj = parseISO(log.date);
                const dayFormatted = format(dateObj, 'MMM d, yyyy');
                const weekday = format(dateObj, 'EEE');

                const h = Math.floor(log.studyMinutes / 60);
                const m = log.studyMinutes % 60;
                const formattedDuration = `${h}h ${m}m`;

                const dayBlocks = blocksByDate.get(log.date) || [];
                const distinctSubjectNames = Array.from(
                  new Set(dayBlocks.map((b) => subjectMap.get(b.subjectId)?.name).filter(Boolean))
                );

                const sessionCount = log.sessions?.length || (log.studyMinutes > 0 ? 1 : 0);

                return (
                  <tr
                    key={log.date}
                    className="hover:bg-[hsl(var(--muted))]/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectDate(log.date)}
                  >
                    <td className="py-3 font-medium text-[hsl(var(--foreground))]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono w-7 uppercase">
                          {weekday}
                        </span>
                        <span>{dayFormatted}</span>
                      </div>
                    </td>

                    <td className="py-3 font-semibold text-emerald-400">
                      {log.studyMinutes > 0 ? formattedDuration : '0m'}
                    </td>

                    <td className="py-3 text-[hsl(var(--muted-foreground))]">
                      {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
                    </td>

                    <td className="py-3">
                      {distinctSubjectNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {distinctSubjectNames.slice(0, 2).map((name) => (
                            <span
                              key={name}
                              className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-300 font-medium"
                            >
                              {name}
                            </span>
                          ))}
                          {distinctSubjectNames.length > 2 && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              +{distinctSubjectNames.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 text-right font-medium text-cyan-400">
                      {log.topicsCompleted || '—'}
                    </td>

                    <td className="py-3 text-right font-medium text-purple-400">
                      {log.revisionsCompleted || '—'}
                    </td>

                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(log.date);
                        }}
                        className="p-1 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-emerald-400 transition-colors"
                        title="View day details"
                        aria-label={`View details for ${log.date}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span>
            Page {page} of {totalPages} ({sortedLogs.length} days total)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
