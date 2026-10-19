'use client';

import { useState, useRef, useEffect, useMemo, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  FileCheck,
  BookOpen,
  Bookmark,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useNotesStore } from '@/store/notes-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { cn } from '@/lib/utils';

interface UploadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string | null;
  defaultChapterId?: string | null;
  defaultTopicId?: string | null;
  onSuccess?: (noteId: string) => void;
}

export function UploadNotesModal({
  isOpen,
  onClose,
  defaultSubjectId,
  defaultChapterId,
  defaultTopicId,
  onSuccess,
}: UploadNotesModalProps) {
  const { uploadNote, isUploading } = useNotesStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  const activeYearId = useAcademicYearStore((s) => s.activeYearId);
  const activeYear = useAcademicYearStore((s) => s.activeYear);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || (subjects[0]?.id ?? ''));
  const [chapterId, setChapterId] = useState(defaultChapterId || '');
  const [topicId, setTopicId] = useState(defaultTopicId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const initialSubId = defaultSubjectId || (subjects[0]?.id ?? '');
      setSubjectId(initialSubId);
      setChapterId(defaultChapterId || '');
      setTopicId(defaultTopicId || '');
      setTitle('');
      setSubtitle('');
      setSelectedFile(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultSubjectId, defaultChapterId, defaultTopicId, subjects]);

  // Available chapters & topics
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId),
    [subjects, subjectId]
  );
  const availableChapters = useMemo(
    () => selectedSubject?.chapters || [],
    [selectedSubject]
  );
  const selectedChapter = useMemo(
    () => availableChapters.find((c) => c.id === chapterId),
    [availableChapters, chapterId]
  );
  const availableTopics = useMemo(
    () => selectedChapter?.topics || [],
    [selectedChapter]
  );

  // Handle subject change: reset chapter/topic if invalid
  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId);
    setChapterId('');
    setTopicId('');
  };

  // Handle chapter change: reset topic if invalid
  const handleChapterChange = (newChapId: string) => {
    setChapterId(newChapId);
    setTopicId('');
  };

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_SIZE) {
      setErrorMessage('File exceeds the 25MB maximum size limit.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!ext || !allowed.includes(ext)) {
      setErrorMessage(`Unsupported file format (.${ext}). Please select a PDF, JPG, or PNG document.`);
      return;
    }

    setSelectedFile(file);

    // Auto-populate title if empty
    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const prettyName = baseName.replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(prettyName);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF or image file to upload.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please provide a title for this note.');
      return;
    }

    if (!subjectId) {
      setErrorMessage('Please select a subject for this note.');
      return;
    }

    try {
      setErrorMessage(null);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      if (subtitle.trim()) {
        formData.append('subtitle', subtitle.trim());
      }
      formData.append('subject_id', subjectId);
      formData.append('academic_year_id', activeYearId);

      if (chapterId) {
        formData.append('chapter_id', chapterId);
      }
      if (topicId) {
        formData.append('topic_id', topicId);
      }

      const createdNote = await uploadNote(formData);
      onClose();
      if (onSuccess) {
        onSuccess(createdNote.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-7 shadow-2xl my-8 relative overflow-hidden"
      >
        {/* Glow accent */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: selectedSubject?.color || '#6366f1' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[hsl(var(--border))] relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: selectedSubject?.color || '#6366f1' }}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Upload Study Notes</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {selectedSubject?.name ? `${selectedSubject.name} · ` : ''}
                {activeYear?.name || 'Academic Year'} Library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 relative z-10">
          {/* File Dropzone */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1.5">
              Document File (PDF or Image) <span className="text-rose-500">*</span>
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 group',
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[hsl(var(--border))] hover:border-indigo-500/50 hover:bg-[hsl(var(--muted)/0.3)]'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-inner">
                    {selectedFile.type.includes('pdf') ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate max-w-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                      {formatFileSize(selectedFile.size)} • Click or drop new file to replace
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                    Click to browse or drag and drop document
                  </p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Supports PDF, JPG, JPEG, PNG (up to 25MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Charaka Samhita Sutrasthana Notes"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
                Subtitle / Description <span className="text-xs font-normal lowercase text-[hsl(var(--muted-foreground))]">(optional)</span>
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Chapter 1-4 Slokas & Diagrammatic Explanations"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex items-center justify-between mb-1">
              <span>Subject <span className="text-rose-500">*</span></span>
              {selectedSubject && (
                <span className="text-[11px] font-normal lowercase text-indigo-400">
                  {availableChapters.length} chapters available
                </span>
              )}
            </label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-[hsl(var(--foreground))] cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Chapter & Topic Linking Card */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Link to Chapter / Topic (Optional)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold">
                Optional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chapter Select */}
              <div>
                <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] block mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  <span>Chapter</span>
                </label>
                <select
                  value={chapterId}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                >
                  <option value="">None / Entire Subject</option>
                  {availableChapters.map((chap, idx) => (
                    <option key={chap.id} value={chap.id}>
                      {chap.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Select */}
              <div>
                <label className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] block mb-1 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-indigo-400" />
                  <span>Topic</span>
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  disabled={!chapterId || availableTopics.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">
                    {!chapterId
                      ? 'Select chapter first'
                      : availableTopics.length === 0
                      ? 'No topics in chapter'
                      : 'None / General Chapter Note'}
                  </option>
                  {availableTopics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Linking allows quick filtering of notes directly when studying chapters and topics.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !title.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Document…</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Upload & Save Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
