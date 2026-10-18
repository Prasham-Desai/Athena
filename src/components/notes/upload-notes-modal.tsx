'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { useNotesStore } from '@/store/notes-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { cn } from '@/lib/utils';

interface UploadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string | null;
  onSuccess?: (noteId: string) => void;
}

export function UploadNotesModal({
  isOpen,
  onClose,
  defaultSubjectId,
  onSuccess,
}: UploadNotesModalProps) {
  const { uploadNote, isUploading } = useNotesStore();
  const subjects = useSubjectsStore((s) => s.subjects);
  const activeYearId = useAcademicYearStore((s) => s.activeYearId);
  const activeYear = useAcademicYearStore((s) => s.activeYear);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || (subjects[0]?.id ?? ''));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Capitalize first letter of words
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[hsl(var(--foreground))]">Upload Study Notes</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {activeYear?.name || 'Academic Year'} Document Library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Dropzone */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1.5">
              Document File (PDF or Image)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2',
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[hsl(var(--border))] hover:border-indigo-500/50 hover:bg-[hsl(var(--muted)/0.4)]'
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
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    {selectedFile.type.includes('pdf') ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {formatFileSize(selectedFile.size)} • Click or drop to replace
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1">
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

          {/* Title input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Charaka Samhita Sutrasthana Notes"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Subtitle input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Chapter 1-4 Slokas & Diagrammatic Explanations"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Subject selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-90 disabled:opacity-50 transition"
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
