'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GraduationCap, Calendar, Trash2, CheckCircle2, Clock, BookOpen, AlertCircle, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

import { useExamsStore } from '@/store/exams-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { PageHeader } from '@/components/shared/page-header';
import { getRelativeDate, cn } from '@/lib/utils';
import type { ExamType, ExamSubject } from '@/types';

export default function ExamsPage() {
  const { exams, fetchExams, addExam, updateExam, deleteExam, isLoading } = useExamsStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ExamType>('test');
  const [date, setDate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<ExamSubject[]>([]);
  const [topicsDescription, setTopicsDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const openModal = (examId?: string) => {
    if (examId) {
      const exam = exams.find(e => e.id === examId);
      if (exam) {
        setEditingExamId(examId);
        setTitle(exam.title);
        setType(exam.type);
        setDate(exam.date);
        setSelectedSubjects(exam.subjects || []);
        setTopicsDescription(exam.topics_description || '');
      }
    } else {
      setEditingExamId(null);
      setTitle('');
      setType('test');
      setDate('');
      setSelectedSubjects([]);
      setTopicsDescription('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExamId(null);
  };

  const handleToggleSubject = (id: string) => {
    setSelectedSubjects(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists) {
        return prev.filter(s => s.id !== id);
      } else {
        return [...prev, { id, date: '' }];
      }
    });
  };

  const handleSubjectDateChange = (id: string, newDate: string) => {
    setSelectedSubjects(prev => 
      prev.map(s => s.id === id ? { ...s, date: newDate } : s)
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map(s => {
        const existing = selectedSubjects.find(es => es.id === s.id);
        return existing ? existing : { id: s.id, date: '' };
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || selectedSubjects.length === 0) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        type,
        date,
        subjects: selectedSubjects,
        topics_description: topicsDescription.trim() || undefined,
      };

      if (editingExamId) {
        await updateExam(editingExamId, payload);
      } else {
        await addExam(payload);
      }
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingExams = useMemo(() => exams.filter(e => !e.completed).sort((a, b) => a.date > b.date ? 1 : -1), [exams]);
  const pastExams = useMemo(() => exams.filter(e => e.completed).sort((a, b) => a.date < b.date ? 1 : -1), [exams]);

  const renderTable = (examList: typeof exams, isPast: boolean) => (
    <div className="grid grid-cols-1 gap-6">
      {examList.length === 0 ? (
        <div className="p-8 text-center bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
          No {isPast ? 'past' : 'upcoming'} exams found.
        </div>
      ) : (
        examList.map((exam) => (
          <div key={exam.id} className="group flex flex-col bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden transition-all hover:border-indigo-500/30 hover:shadow-md">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 bg-[hsl(var(--muted))]/10 border-b border-[hsl(var(--border))]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
                  )}
                  <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">{exam.title}</h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    exam.type === 'exam' 
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  )}>
                    {exam.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] sm:pl-8">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{format(new Date(exam.date), 'MMMM d, yyyy')}</span>
                  {!isPast && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-500 font-medium">{getRelativeDate(exam.date)}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openModal(exam.id)}
                  className="p-2 text-[hsl(var(--muted-foreground))] hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors bg-[hsl(var(--background))]"
                  title="Edit Exam"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteExam(exam.id)}
                  className="p-2 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors bg-[hsl(var(--background))]"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:px-6">
              {/* Subjects Column */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] flex items-center gap-2 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  Syllabus Subjects
                </h4>
                {(!exam.subjects || exam.subjects.length === 0) ? (
                  <p className="text-sm italic text-[hsl(var(--muted-foreground))]">No subjects selected</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map(s => {
                      const subjectData = subjects.find(sub => sub.id === s.id);
                      if (!subjectData) return null;
                      return (
                        <div 
                          key={s.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-transform hover:scale-105"
                          style={{ 
                            backgroundColor: subjectData.details?.secondaryGlow || `${subjectData.color}15`, 
                            borderColor: `${subjectData.color}30`,
                            color: subjectData.details?.textAccent || subjectData.color,
                          }}
                        >
                          <span>{subjectData.name}</span>
                          {s.date && (
                            <span className="text-xs opacity-80 pl-2 border-l border-current/20">
                              {format(new Date(s.date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Topics Column */}
              <div className="space-y-3 flex flex-col">
                <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] flex items-center gap-2 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Topics Description
                </h4>
                <div className="bg-[hsl(var(--muted))]/20 rounded-xl p-4 flex-1 border border-[hsl(var(--border))]">
                  {exam.topics_description ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-[hsl(var(--foreground))]">
                      {exam.topics_description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-[hsl(var(--muted-foreground))] flex h-full items-center">No topics specified.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Exams & Tests" 
          description="Manage your upcoming university exams and unit tests" 
        />
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Exam
        </button>
      </div>

      {isLoading && exams.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse text-sm text-[hsl(var(--muted-foreground))]">Loading exams...</div>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[hsl(var(--foreground))]">
              <GraduationCap className="w-6 h-6 text-indigo-500" />
              Upcoming
            </h2>
            {renderTable(upcomingExams, false)}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[hsl(var(--foreground))]">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Completed
            </h2>
            {renderTable(pastExams, true)}
          </section>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[hsl(var(--card))] rounded-3xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingExamId ? 'Edit Exam' : 'Schedule Exam'}</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="exam-form" onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Unit Test 1, Final University Exam"
                      className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:border-[hsl(var(--border-hover))]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ExamType)}
                        className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                      >
                        <option value="exam">Exam</option>
                        <option value="test">Test</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">Tentative Start Date</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Topics to be asked</label>
                    <textarea
                      value={topicsDescription}
                      onChange={(e) => setTopicsDescription(e.target.value)}
                      placeholder="e.g. Chapters 1-3, Focus on calculus and algebra..."
                      className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] resize-y"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">Syllabus Subjects</label>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-bold tracking-wide uppercase px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors"
                      >
                        {selectedSubjects.length === subjects.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {subjects.map(subject => {
                        const selectedState = selectedSubjects.find(s => s.id === subject.id);
                        const isSelected = !!selectedState;
                        
                        return (
                          <div
                            key={subject.id}
                            className={cn(
                              "flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                              isSelected 
                                ? "border-indigo-500 bg-indigo-500/5 shadow-sm"
                                : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 hover:border-indigo-500/30"
                            )}
                          >
                            <div 
                              onClick={() => handleToggleSubject(subject.id)}
                              className="flex items-center gap-3 flex-1"
                            >
                              <div className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                isSelected ? "border-indigo-500 bg-indigo-500" : "border-[hsl(var(--muted-foreground))]"
                              )}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <span className="text-sm font-semibold truncate" style={{ color: isSelected ? 'inherit' : 'var(--muted-foreground)' }}>
                                {subject.name}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="pl-7 mt-1">
                                <input
                                  type="date"
                                  value={selectedState.date || ''}
                                  onChange={(e) => handleSubjectDateChange(subject.id, e.target.value)}
                                  className="w-full px-3 py-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  placeholder="Tentative date"
                                  title="Specific exam date for this subject"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {selectedSubjects.length === 0 && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5 mt-2 bg-red-500/10 px-3 py-2 rounded-lg font-medium">
                        <AlertCircle className="w-4 h-4" /> Please select at least one subject.
                      </p>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-[hsl(var(--border))] flex justify-end gap-3 bg-[hsl(var(--muted))]/30 mt-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-bold hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="exam-form"
                  disabled={isSubmitting || !title.trim() || !date || selectedSubjects.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-95"
                >
                  {isSubmitting ? 'Saving...' : (editingExamId ? 'Update Exam' : 'Save Exam')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
