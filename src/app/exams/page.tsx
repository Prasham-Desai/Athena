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
      }
    } else {
      setEditingExamId(null);
      setTitle('');
      setType('test');
      setDate('');
      setSelectedSubjects([]);
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
    <div className="overflow-x-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <table className="w-full text-left text-base">
        <thead className="bg-[hsl(var(--muted))]/50">
          <tr>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Title</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Type</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] w-40">Tentative Start Date</th>
            <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {examList.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                No {isPast ? 'past' : 'upcoming'} exams found.
              </td>
            </tr>
          ) : (
            examList.map((exam) => {
              return (
                <React.Fragment key={exam.id}>
                  {/* First Row: Main Exam Info */}
                  <tr className="hover:bg-[hsl(var(--muted))]/30 transition-colors group">
                    <td className="px-4 py-3 font-medium align-middle">
                      <div className="flex items-center gap-2">
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        )}
                        <span>{exam.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block",
                        exam.type === 'exam' 
                          ? "bg-purple-500/10 text-purple-500" 
                          : "bg-blue-500/10 text-blue-500"
                      )}>
                        {exam.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{format(new Date(exam.date), 'MMM d, yyyy')}</span>
                        {!isPast && (
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">
                            {getRelativeDate(exam.date)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(exam.id)}
                          className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit Exam"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Second Row: Subject Tabular Data */}
                  <tr>
                    <td colSpan={4} className="p-0 border-t-0 border-b-4 border-b-[hsl(var(--background))]">
                      <div className="px-4 pb-4 pt-2">
                        <table className="w-full text-sm sm:text-base rounded-xl overflow-hidden border border-[hsl(var(--border))] shadow-sm">
                          <thead className="bg-[hsl(var(--muted))]/40 text-[hsl(var(--muted-foreground))]">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Subject</th>
                              <th className="px-3 py-2 text-left font-medium w-40">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[hsl(var(--border))]/50">
                            {(!exam.subjects || exam.subjects.length === 0) ? (
                              <tr>
                                <td colSpan={2} className="px-3 py-2 text-[hsl(var(--muted-foreground))] italic">No subjects selected</td>
                              </tr>
                            ) : (
                              exam.subjects.map(s => {
                                const subjectData = subjects.find(sub => sub.id === s.id);
                                if (!subjectData) return null;
                                return (
                                  <tr key={s.id}>
                                    <td className="px-4 py-3">
                                      <span 
                                        className="text-xs sm:text-sm px-3 py-1 rounded-md inline-block font-medium"
                                        style={{ 
                                          backgroundColor: subjectData.details?.secondaryGlow || `${subjectData.color}20`, 
                                          color: subjectData.details?.textAccent || subjectData.color,
                                          boxShadow: subjectData.details?.secondaryGlow ? `0 0 10px ${subjectData.details.secondaryGlow}40` : 'none'
                                        }}
                                      >
                                        {subjectData.name}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                      {s.date ? format(new Date(s.date), 'MMM d, yyyy') : <span className="text-[hsl(var(--muted-foreground))]">Tentative</span>}
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
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
          onClick={() => openModal()}
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
              className="relative w-full max-w-xl bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-[hsl(var(--border))]">
                <h2 className="text-lg font-semibold">{editingExamId ? 'Edit Exam' : 'Schedule Exam'}</h2>
              </div>
              
              <div className="p-5 overflow-y-auto">
                <form id="exam-form" onSubmit={handleSave} className="space-y-5">
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
                        <option value="exam">Exam</option>
                        <option value="test">Test</option>
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

                  <div className="space-y-3 pt-2">
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
                    
                    <div className="space-y-2">
                      {subjects.map(subject => {
                        const selectedState = selectedSubjects.find(s => s.id === subject.id);
                        const isSelected = !!selectedState;
                        
                        return (
                          <div
                            key={subject.id}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-colors",
                              isSelected 
                                ? "border-indigo-500 bg-indigo-500/5"
                                : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50"
                            )}
                          >
                            <div 
                              onClick={() => handleToggleSubject(subject.id)}
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                            >
                              <div className={cn(
                                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                isSelected ? "border-indigo-500 bg-indigo-500" : "border-[hsl(var(--muted-foreground))]"
                              )}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <span className="text-sm font-medium truncate" style={{ color: isSelected ? 'inherit' : 'var(--muted-foreground)' }}>
                                {subject.name}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="pl-7 sm:pl-0 shrink-0">
                                <input
                                  type="date"
                                  value={selectedState.date || ''}
                                  onChange={(e) => handleSubjectDateChange(subject.id, e.target.value)}
                                  className="w-full sm:w-auto px-2 py-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                  placeholder="Leave blank for Tentative"
                                />
                              </div>
                            )}
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
                  onClick={closeModal}
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
