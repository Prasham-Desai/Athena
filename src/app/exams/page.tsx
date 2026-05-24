'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GraduationCap, Calendar, Trash2, CheckCircle2, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { useExamsStore } from '@/store/exams-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { PageHeader } from '@/components/shared/page-header';
import { getRelativeDate, cn } from '@/lib/utils';
import type { ExamType } from '@/types';

export default function ExamsPage() {
  const { exams, fetchExams, addExam, deleteExam, isLoading } = useExamsStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ExamType>('test');
  const [date, setDate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleToggleSubject = (id: string) => {
    setSelectedSubjects(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map(s => s.id));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || selectedSubjects.length === 0) return;

    try {
      setIsSubmitting(true);
      await addExam({
        title: title.trim(),
        type,
        date,
        subjectIds: selectedSubjects,
      });
      setIsModalOpen(false);
      setTitle('');
      setDate('');
      setType('test');
      setSelectedSubjects([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingExams = useMemo(() => exams.filter(e => !e.completed).sort((a, b) => a.date > b.date ? 1 : -1), [exams]);
  const pastExams = useMemo(() => exams.filter(e => e.completed).sort((a, b) => a.date < b.date ? 1 : -1), [exams]);

  const renderTable = (examList: typeof exams, isPast: boolean) => (
    <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[hsl(var(--muted))]/50">
          <tr>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Title</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Type</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Tentative Start Date</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Subjects</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {examList.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                No {isPast ? 'past' : 'upcoming'} exams found.
              </td>
            </tr>
          ) : (
            examList.map((exam) => {
              const examSubjects = subjects.filter(s => exam.subjectIds.includes(s.id));
              return (
                <tr key={exam.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-indigo-500" />
                      )}
                      {exam.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                      exam.type === 'exam' 
                        ? "bg-purple-500/10 text-purple-500" 
                        : "bg-blue-500/10 text-blue-500"
                    )}>
                      {exam.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{format(new Date(exam.date), 'MMM d, yyyy')}</span>
                      {!isPast && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {getRelativeDate(exam.date)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {examSubjects.length === subjects.length ? (
                        <span className="text-xs px-2 py-1 bg-[hsl(var(--accent))] rounded-md">All Subjects</span>
                      ) : (
                        examSubjects.map(s => (
                          <span 
                            key={s.id} 
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${s.color}20`, color: s.color }}
                          >
                            {s.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Exams & Tests" 
          description="Manage your upcoming university exams and unit tests" 
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Exam
        </button>
      </div>

      {isLoading && exams.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse text-sm text-[hsl(var(--muted-foreground))]">Loading exams...</div>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              Upcoming
            </h2>
            {renderTable(upcomingExams, false)}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Completed
            </h2>
            {renderTable(pastExams, true)}
          </section>
        </div>
      )}

      {/* Add Exam Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-[hsl(var(--border))]">
                <h2 className="text-lg font-semibold">Schedule Exam</h2>
              </div>
              
              <div className="p-5 overflow-y-auto">
                <form id="exam-form" onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Unit Test 1, Final University Exam"
                      className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ExamType)}
                        className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="test">Unit Test</option>
                        <option value="exam">University Exam</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Tentative Start Date</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Syllabus Subjects</label>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.map(subject => {
                        const isSelected = selectedSubjects.includes(subject.id);
                        return (
                          <div
                            key={subject.id}
                            onClick={() => handleToggleSubject(subject.id)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm",
                              isSelected 
                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                              isSelected ? "border-indigo-500 bg-indigo-500" : "border-[hsl(var(--muted-foreground))]"
                            )}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className="truncate">{subject.name}</span>
                          </div>
                        )
                      })}
                    </div>
                    {selectedSubjects.length === 0 && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> Please select at least one subject.
                      </p>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-[hsl(var(--border))] flex justify-end gap-3 bg-[hsl(var(--muted))]/20 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="exam-form"
                  disabled={isSubmitting || !title.trim() || !date || selectedSubjects.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Exam'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
