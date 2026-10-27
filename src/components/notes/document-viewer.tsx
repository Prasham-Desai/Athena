'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Pen,
  Highlighter,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  MoveRight,
  Download,
  FileDown,
  Trash2,
  CheckCheck,
  Loader2,
  AlertCircle,
  X,
  Layers,
  Edit2,
  BookOpen,
  Columns2,
} from 'lucide-react';
import type { NoteDocument, AnnotationItem, AnnotationPoint, AnnotationToolType } from '@/types';
import { cn } from '@/lib/utils';
import { useNotesStore } from '@/store/notes-store';

interface DocumentViewerProps {
  note: NoteDocument;
  onClose: () => void;
  onUpdate?: (updated: NoteDocument) => void;
}

const PALETTE_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Dark', hex: '#1e293b' },
  { name: 'White', hex: '#ffffff' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Green', hex: '#4ade80' },
  { name: 'Cyan', hex: '#38bdf8' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Orange', hex: '#fb923c' },
];

const PEN_WIDTHS = [2, 4, 6, 8, 12];
const HIGHLIGHTER_WIDTHS = [16, 24, 32, 40];

export function DocumentViewer({ note, onClose, onUpdate }: DocumentViewerProps) {
  const isPdf = note.file_type === 'pdf';
  const fileUrl = `/api/notes/${note.id}/file`;

  // Document state
  const [numPages, setNumPages] = useState<number>(note.page_count || 1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [docLoadError, setDocLoadError] = useState<string | null>(null);

  // Tools & styling
  const [activeTool, setActiveTool] = useState<AnnotationToolType>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [highlighterColor, setHighlighterColor] = useState<string>('#facc15');
  const [penWidth, setPenWidth] = useState<number>(4);
  const [highlighterWidth, setHighlighterWidth] = useState<number>(24);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // View mode: single page or two pages side-by-side
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');

  // Screen responsiveness: automatically fall back to single page mode on narrow screens
  const [isWideScreen, setIsWideScreen] = useState<boolean>(true);
  useEffect(() => {
    function handleResize() {
      setIsWideScreen(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveViewMode = isPdf && numPages > 1 && viewMode === 'double' && isWideScreen ? 'double' : 'single';

  // Second page canvas refs (for two-page mode)
  const docCanvas2Ref = useRef<HTMLCanvasElement>(null);
  const drawCanvas2Ref = useRef<HTMLCanvasElement>(null);
  const renderTask2Ref = useRef<any>(null);

  // Active page being annotated/drawn on (currentPage or currentPage + 1)
  const activeDrawingPageRef = useRef<number>(1);

  // Text tool prompt modal state
  const [textModal, setTextModal] = useState<{ x: number; y: number; isOpen: boolean; page: number }>({
    x: 0,
    y: 0,
    isOpen: false,
    page: 1,
  });
  const [textContent, setTextContent] = useState<string>('');
  const [textSize, setTextSize] = useState<number>(18);

  // Rename modal state
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState(note.title);
  const [renameSubtitle, setRenameSubtitle] = useState(note.subtitle || '');
  const [isRenaming, setIsRenaming] = useState(false);

  // Annotations map: pageNumber -> AnnotationItem[]
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, AnnotationItem[]>>({});
  // Undo/Redo history stack: pageNumber -> { past: AnnotationItem[][], future: AnnotationItem[][] }
  const [history, setHistory] = useState<
    Record<number, { past: AnnotationItem[][]; future: AnnotationItem[][] }>
  >({});

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Canvases
  const containerRef = useRef<HTMLDivElement>(null);
  const docCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Pointer drawing tracking
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<AnnotationPoint[]>([]);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const { updateNote } = useNotesStore();

  // -------------------------------------------------------------------------
  // 1. Load initial annotations from DB
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadAnnotations() {
      try {
        const res = await fetch(`/api/notes/${note.id}/annotations`);
        if (res.ok) {
          const json: any = await res.json();
          if (json.success && json.data && isMounted) {
            setPageAnnotations(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load annotations:', err);
      }
    }
    loadAnnotations();
    return () => {
      isMounted = false;
    };
  }, [note.id]);

  // -------------------------------------------------------------------------
  // 2. Load PDF document using dynamic client-side loader
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    if (!isPdf) {
      setNumPages(1);
      setIsLoadingDoc(false);
      return;
    }

    async function getPdfJsLibrary() {
      if (typeof window === 'undefined') return null;
      if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

      return new Promise<any>((resolve, reject) => {
        const existing = document.querySelector('script[data-pdfjs="true"]');
        if (existing) {
          existing.addEventListener('load', () => resolve((window as any).pdfjsLib));
          existing.addEventListener('error', () => reject(new Error('Failed to load PDF.js')));
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.setAttribute('data-pdfjs', 'true');
        script.async = true;
        script.onload = () => {
          const pdfjs = (window as any).pdfjsLib;
          if (pdfjs) {
            pdfjs.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(pdfjs);
          } else {
            reject(new Error('PDF.js script loaded but library not found'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
        document.head.appendChild(script);
      });
    }

    async function initPdf() {
      setIsLoadingDoc(true);
      setDocLoadError(null);
      try {
        const pdfjs = await getPdfJsLibrary();
        if (!pdfjs) throw new Error('PDF.js unavailable');

        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjs.getDocument(fileUrl);
        const doc = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setIsLoadingDoc(false);
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setDocLoadError(err.message || 'Could not load PDF document.');
          setIsLoadingDoc(false);
        }
      }
    }

    initPdf();

    return () => {
      isMounted = false;
    };
  }, [isPdf, fileUrl]);

  // Reset viewport scroll to top whenever page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Keyboard navigation shortcuts: Arrow keys / PageUp / PageDown / Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (textModal.isOpen || isRenameOpen) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        const step = effectiveViewMode === 'double' ? 2 : 1;
        setCurrentPage((p) => Math.max(1, p - step));
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        const step = effectiveViewMode === 'double' ? 2 : 1;
        setCurrentPage((p) => Math.min(numPages, p + step));
      } else if (e.key === 'Escape') {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveViewMode, numPages, isSidebarOpen, onClose, textModal.isOpen, isRenameOpen]);

  // -------------------------------------------------------------------------
  // 3. Render Page (PDF or Image) onto docCanvasRef & docCanvas2Ref
  // -------------------------------------------------------------------------
  const renderDocumentPage = useCallback(async () => {
    const docCanvas = docCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!docCanvas || !drawCanvas) return;

    if (isPdf) {
      if (!pdfDoc) return;
      try {
        // Cancel existing renders if any
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {
            // ignore cancel error
          }
        }
        if (renderTask2Ref.current) {
          try {
            renderTask2Ref.current.cancel();
          } catch (e) {
            // ignore cancel error
          }
        }

        // Render Page 1 (currentPage)
        const page1 = await pdfDoc.getPage(currentPage);
        const viewport1 = page1.getViewport({ scale: zoomScale * 1.5 });

        // Set dimensions (accounting for devicePixelRatio for ultra-sharp text)
        docCanvas.width = viewport1.width;
        docCanvas.height = viewport1.height;
        docCanvas.style.width = `${viewport1.width / 1.5}px`;
        docCanvas.style.height = `${viewport1.height / 1.5}px`;

        drawCanvas.width = viewport1.width;
        drawCanvas.height = viewport1.height;
        drawCanvas.style.width = `${viewport1.width / 1.5}px`;
        drawCanvas.style.height = `${viewport1.height / 1.5}px`;

        const ctx1 = docCanvas.getContext('2d');
        if (ctx1) {
          const renderContext1 = {
            canvasContext: ctx1,
            viewport: viewport1,
          };
          const task1 = page1.render(renderContext1);
          renderTaskRef.current = task1;
          await task1.promise;
        }

        // Render Page 2 if double mode is active and next page exists
        if (effectiveViewMode === 'double' && currentPage < numPages) {
          const docCanvas2 = docCanvas2Ref.current;
          const drawCanvas2 = drawCanvas2Ref.current;
          if (docCanvas2 && drawCanvas2) {
            const page2 = await pdfDoc.getPage(currentPage + 1);
            const viewport2 = page2.getViewport({ scale: zoomScale * 1.5 });

            docCanvas2.width = viewport2.width;
            docCanvas2.height = viewport2.height;
            docCanvas2.style.width = `${viewport2.width / 1.5}px`;
            docCanvas2.style.height = `${viewport2.height / 1.5}px`;

            drawCanvas2.width = viewport2.width;
            drawCanvas2.height = viewport2.height;
            drawCanvas2.style.width = `${viewport2.width / 1.5}px`;
            drawCanvas2.style.height = `${viewport2.height / 1.5}px`;

            const ctx2 = docCanvas2.getContext('2d');
            if (ctx2) {
              const renderContext2 = {
                canvasContext: ctx2,
                viewport: viewport2,
              };
              const task2 = page2.render(renderContext2);
              renderTask2Ref.current = task2;
              await task2.promise;
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      }
    } else {
      // Image rendering
      const img = new Image();
      img.src = fileUrl;
      img.onload = () => {
        const maxWidth = 1200 * zoomScale;
        const scale = Math.min(1, maxWidth / img.naturalWidth) * zoomScale;
        const width = img.naturalWidth * scale;
        const height = img.naturalHeight * scale;

        docCanvas.width = width * 1.5;
        docCanvas.height = height * 1.5;
        docCanvas.style.width = `${width}px`;
        docCanvas.style.height = `${height}px`;

        drawCanvas.width = width * 1.5;
        drawCanvas.height = height * 1.5;
        drawCanvas.style.width = `${width}px`;
        drawCanvas.style.height = `${height}px`;

        const ctx = docCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, docCanvas.width, docCanvas.height);
        }
      };
    }
  }, [isPdf, pdfDoc, currentPage, zoomScale, fileUrl, effectiveViewMode, numPages]);

  // -------------------------------------------------------------------------
  // 4. Draw page annotations onto drawCanvasRef & drawCanvas2Ref
  // -------------------------------------------------------------------------
  const redrawAnnotations = useCallback(() => {
    // Redraw Page 1
    const drawCanvas = drawCanvasRef.current;
    if (drawCanvas) {
      const ctx = drawCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        const items = pageAnnotations[currentPage] || [];
        const w = drawCanvas.width;
        const h = drawCanvas.height;

        for (const item of items) {
          renderAnnotationItem(ctx, item, w, h);
        }
      }
    }

    // Redraw Page 2 (if in double mode)
    if (effectiveViewMode === 'double' && currentPage < numPages) {
      const drawCanvas2 = drawCanvas2Ref.current;
      if (drawCanvas2) {
        const ctx2 = drawCanvas2.getContext('2d');
        if (ctx2) {
          ctx2.clearRect(0, 0, drawCanvas2.width, drawCanvas2.height);
          const items2 = pageAnnotations[currentPage + 1] || [];
          const w2 = drawCanvas2.width;
          const h2 = drawCanvas2.height;

          for (const item of items2) {
            renderAnnotationItem(ctx2, item, w2, h2);
          }
        }
      }
    }
  }, [currentPage, pageAnnotations, effectiveViewMode, numPages]);

  // Trigger render on page / zoom / viewMode change
  useEffect(() => {
    renderDocumentPage();
  }, [renderDocumentPage]);

  // Trigger annotation redraw when page or annotations change
  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // -------------------------------------------------------------------------
  // 5. Annotation item renderer
  // -------------------------------------------------------------------------
  function renderAnnotationItem(
    ctx: CanvasRenderingContext2D,
    item: AnnotationItem,
    w: number,
    h: number
  ) {
    ctx.save();

    if (item.type === 'pen' || item.type === 'highlighter') {
      const isHighlighter = item.type === 'highlighter';
      ctx.strokeStyle = item.color;
      // Adjust stroke width according to canvas resolution multiplier
      ctx.lineWidth = (item.strokeWidth || 4) * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = isHighlighter ? item.opacity || 0.35 : item.opacity || 1.0;

      if (isHighlighter) {
        ctx.globalCompositeOperation = 'multiply';
      }

      const points = item.points || [];
      if (points.length === 1) {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(points[0].x * w, points[0].y * h, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x * w, points[0].y * h);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x * w, points[i].y * h);
        }
        ctx.stroke();
      }
    } else if (item.type === 'rect') {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = (item.strokeWidth || 3) * 1.5;
      ctx.globalAlpha = item.opacity || 1.0;
      const x = (item.x || 0) * w;
      const y = (item.y || 0) * h;
      const width = (item.width || 0) * w;
      const height = (item.height || 0) * h;
      ctx.strokeRect(x, y, width, height);
    } else if (item.type === 'circle') {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = (item.strokeWidth || 3) * 1.5;
      ctx.globalAlpha = item.opacity || 1.0;
      const x = (item.x || 0) * w;
      const y = (item.y || 0) * h;
      const width = Math.abs((item.width || 0) * w);
      const height = Math.abs((item.height || 0) * h);
      const radiusX = width / 2;
      const radiusY = height / 2;
      const centerX = x + radiusX;
      const centerY = y + radiusY;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.type === 'line' || item.type === 'arrow') {
      const points = item.points || [];
      if (points.length >= 2) {
        const x1 = points[0].x * w;
        const y1 = points[0].y * h;
        const x2 = points[1].x * w;
        const y2 = points[1].y * h;

        ctx.strokeStyle = item.color;
        ctx.lineWidth = (item.strokeWidth || 3) * 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = item.opacity || 1.0;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (item.type === 'arrow') {
          // Draw arrowhead at (x2, y2)
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLength = 15;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    } else if (item.type === 'text') {
      ctx.fillStyle = item.color;
      ctx.font = `600 ${(item.fontSize || 18) * 1.5}px Inter, sans-serif`;
      ctx.globalAlpha = item.opacity || 1.0;
      const x = (item.x || 0) * w;
      const y = (item.y || 0) * h;
      ctx.fillText(item.text || '', x, y);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 6. Autosave mechanism with debouncing
  // -------------------------------------------------------------------------
  const savePageAnnotations = useCallback(
    async (page: number, items: AnnotationItem[]) => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/notes/${note.id}/annotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_number: page,
            annotations: items,
          }),
        });

        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (e) {
        console.error('Failed to save annotations:', e);
        setSaveStatus('error');
      }
    },
    [note.id]
  );

  const triggerAutosave = useCallback(
    (page: number, newItems: AnnotationItem[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setSaveStatus('saving');
      saveTimeoutRef.current = setTimeout(() => {
        savePageAnnotations(page, newItems);
      }, 750);
    },
    [savePageAnnotations]
  );

  // -------------------------------------------------------------------------
  // 7. Push Annotation & History Stack
  // -------------------------------------------------------------------------
  const pushNewAnnotation = useCallback(
    (item: AnnotationItem, targetPage: number = activeDrawingPageRef.current) => {
      const currentList = pageAnnotations[targetPage] || [];
      const updatedList = [...currentList, item];

      // Update history for Undo/Redo
      const curHistory = history[targetPage] || { past: [], future: [] };
      setHistory((prev) => ({
        ...prev,
        [targetPage]: {
          past: [...curHistory.past, currentList],
          future: [],
        },
      }));

      // Update annotations state
      setPageAnnotations((prev) => ({
        ...prev,
        [targetPage]: updatedList,
      }));

      // Autosave
      triggerAutosave(targetPage, updatedList);
    },
    [pageAnnotations, history, triggerAutosave]
  );

  const handleUndo = useCallback(() => {
    const activePage = activeDrawingPageRef.current;
    const pageToUndo =
      (history[activePage]?.past?.length || 0) > 0
        ? activePage
        : (history[currentPage]?.past?.length || 0) > 0
        ? currentPage
        : effectiveViewMode === 'double' && (history[currentPage + 1]?.past?.length || 0) > 0
        ? currentPage + 1
        : currentPage;

    const curHistory = history[pageToUndo];
    if (!curHistory || curHistory.past.length === 0) return;

    const previousState = curHistory.past[curHistory.past.length - 1];
    const newPast = curHistory.past.slice(0, curHistory.past.length - 1);
    const currentList = pageAnnotations[pageToUndo] || [];

    setHistory((prev) => ({
      ...prev,
      [pageToUndo]: {
        past: newPast,
        future: [currentList, ...curHistory.future],
      },
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [pageToUndo]: previousState,
    }));

    triggerAutosave(pageToUndo, previousState);
  }, [currentPage, effectiveViewMode, history, pageAnnotations, triggerAutosave]);

  const handleRedo = useCallback(() => {
    const activePage = activeDrawingPageRef.current;
    const pageToRedo =
      (history[activePage]?.future?.length || 0) > 0
        ? activePage
        : (history[currentPage]?.future?.length || 0) > 0
        ? currentPage
        : effectiveViewMode === 'double' && (history[currentPage + 1]?.future?.length || 0) > 0
        ? currentPage + 1
        : currentPage;

    const curHistory = history[pageToRedo];
    if (!curHistory || curHistory.future.length === 0) return;

    const nextState = curHistory.future[0];
    const newFuture = curHistory.future.slice(1);
    const currentList = pageAnnotations[pageToRedo] || [];

    setHistory((prev) => ({
      ...prev,
      [pageToRedo]: {
        past: [...curHistory.past, currentList],
        future: newFuture,
      },
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [pageToRedo]: nextState,
    }));

    triggerAutosave(pageToRedo, nextState);
  }, [currentPage, effectiveViewMode, history, pageAnnotations, triggerAutosave]);

  const handleClearPage = useCallback(() => {
    const pageToClear =
      effectiveViewMode === 'double' && activeDrawingPageRef.current === currentPage + 1
        ? currentPage + 1
        : currentPage;

    if (confirm(`Clear all annotations on Page ${pageToClear}?`)) {
      const currentList = pageAnnotations[pageToClear] || [];
      const curHistory = history[pageToClear] || { past: [], future: [] };

      setHistory((prev) => ({
        ...prev,
        [pageToClear]: {
          past: [...curHistory.past, currentList],
          future: [],
        },
      }));

      setPageAnnotations((prev) => ({
        ...prev,
        [pageToClear]: [],
      }));

      triggerAutosave(pageToClear, []);
    }
  }, [currentPage, effectiveViewMode, pageAnnotations, history, triggerAutosave]);

  // -------------------------------------------------------------------------
  // 8. Eraser tool: Remove strokes / shapes on click or swipe
  // -------------------------------------------------------------------------
  const eraseNearPoint = useCallback(
    (normX: number, normY: number, targetPage: number = activeDrawingPageRef.current) => {
      const items = pageAnnotations[targetPage] || [];
      if (items.length === 0) return;

      const threshold = 0.035; // Normalized hit detection threshold
      const remaining: AnnotationItem[] = [];
      let erasedAny = false;

      for (const item of items) {
        let hit = false;
        if (item.type === 'pen' || item.type === 'highlighter') {
          for (const p of item.points || []) {
            const dist = Math.hypot(p.x - normX, p.y - normY);
            if (dist < threshold) {
              hit = true;
              break;
            }
          }
        } else if (item.type === 'rect' || item.type === 'circle') {
          const x = item.x || 0;
          const y = item.y || 0;
          const w = item.width || 0;
          const h = item.height || 0;
          if (normX >= x && normX <= x + w && normY >= y && normY <= y + h) {
            hit = true;
          }
        } else if (item.type === 'text') {
          const x = item.x || 0;
          const y = item.y || 0;
          if (Math.hypot(x - normX, y - normY) < 0.05) {
            hit = true;
          }
        } else if (item.type === 'line' || item.type === 'arrow') {
          const pts = item.points || [];
          if (pts.length >= 2) {
            const p1 = pts[0];
            const p2 = pts[1];
            // Point to line segment distance
            const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y) ** 2;
            if (l2 === 0) {
              hit = Math.hypot(normX - p1.x, normY - p1.y) < threshold;
            } else {
              const t = Math.max(
                0,
                Math.min(1, ((normX - p1.x) * (p2.x - p1.x) + (normY - p1.y) * (p2.y - p1.y)) / l2)
              );
              const projX = p1.x + t * (p2.x - p1.x);
              const projY = p1.y + t * (p2.y - p1.y);
              hit = Math.hypot(normX - projX, normY - projY) < threshold;
            }
          }
        }

        if (hit) {
          erasedAny = true;
        } else {
          remaining.push(item);
        }
      }

      if (erasedAny) {
        const curHistory = history[targetPage] || { past: [], future: [] };
        setHistory((prev) => ({
          ...prev,
          [targetPage]: {
            past: [...curHistory.past, items],
            future: [],
          },
        }));

        setPageAnnotations((prev) => ({
          ...prev,
          [targetPage]: remaining,
        }));

        triggerAutosave(targetPage, remaining);
      }
    },
    [pageAnnotations, history, triggerAutosave]
  );

  // -------------------------------------------------------------------------
  // 9. Pointer Event Handlers for Drawing & Shapes
  // -------------------------------------------------------------------------
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const normY = Math.max(0, Math.min(1, clientY / rect.height));

    return { x: clientX, y: clientY, normX, normY };
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>,
    targetPage: number = currentPage
  ) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activeDrawingPageRef.current = targetPage;
    const { normX, normY } = getCanvasCoords(e);

    if (activeTool === 'eraser') {
      isDrawingRef.current = true;
      eraseNearPoint(normX, normY, targetPage);
      return;
    }

    if (activeTool === 'text') {
      setTextModal({ x: normX, y: normY, isOpen: true, page: targetPage });
      return;
    }

    isDrawingRef.current = true;
    startPointRef.current = { x: normX, y: normY };

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      currentPointsRef.current = [{ x: normX, y: normY }];
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const { normX, normY } = getCanvasCoords(e);
    const targetPage = activeDrawingPageRef.current;

    if (activeTool === 'eraser') {
      eraseNearPoint(normX, normY, targetPage);
      return;
    }

    const targetCanvas =
      targetPage === currentPage ? drawCanvasRef.current : drawCanvas2Ref.current;
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      currentPointsRef.current.push({ x: normX, y: normY });

      // Immediate visual preview of the active freehand stroke
      redrawAnnotations();
      renderAnnotationItem(
        ctx,
        {
          id: 'temp',
          type: activeTool,
          points: currentPointsRef.current,
          color: activeTool === 'pen' ? selectedColor : highlighterColor,
          strokeWidth: activeTool === 'pen' ? penWidth : highlighterWidth,
          opacity: activeTool === 'pen' ? 1.0 : 0.35,
        },
        targetCanvas.width,
        targetCanvas.height
      );
      return;
    }

    // Dynamic shape preview while dragging
    if (['rect', 'circle', 'line', 'arrow'].includes(activeTool) && startPointRef.current) {
      redrawAnnotations();

      const start = startPointRef.current;
      let tempItem: AnnotationItem;

      if (activeTool === 'rect') {
        const x = Math.min(start.x, normX);
        const y = Math.min(start.y, normY);
        const width = Math.abs(normX - start.x);
        const height = Math.abs(normY - start.y);
        tempItem = {
          id: 'temp',
          type: 'rect',
          x,
          y,
          width,
          height,
          color: selectedColor,
          strokeWidth: penWidth,
          opacity: 1.0,
        };
      } else if (activeTool === 'circle') {
        const x = Math.min(start.x, normX);
        const y = Math.min(start.y, normY);
        const width = Math.abs(normX - start.x);
        const height = Math.abs(normY - start.y);
        tempItem = {
          id: 'temp',
          type: 'circle',
          x,
          y,
          width,
          height,
          color: selectedColor,
          strokeWidth: penWidth,
          opacity: 1.0,
        };
      } else {
        tempItem = {
          id: 'temp',
          type: activeTool,
          points: [start, { x: normX, y: normY }],
          color: selectedColor,
          strokeWidth: penWidth,
          opacity: 1.0,
        };
      }

      renderAnnotationItem(ctx, tempItem, targetCanvas.width, targetCanvas.height);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const targetPage = activeDrawingPageRef.current;
    const { normX, normY } = getCanvasCoords(e);

    if (activeTool === 'eraser') return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      if (currentPointsRef.current.length > 0) {
        pushNewAnnotation(
          {
            id: `anno_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: activeTool,
            points: [...currentPointsRef.current],
            color: activeTool === 'pen' ? selectedColor : highlighterColor,
            strokeWidth: activeTool === 'pen' ? penWidth : highlighterWidth,
            opacity: activeTool === 'pen' ? 1.0 : 0.35,
          },
          targetPage
        );
      }
      currentPointsRef.current = [];
      return;
    }

    if (['rect', 'circle', 'line', 'arrow'].includes(activeTool) && startPointRef.current) {
      const start = startPointRef.current;
      startPointRef.current = null;

      if (activeTool === 'rect') {
        const x = Math.min(start.x, normX);
        const y = Math.min(start.y, normY);
        const width = Math.abs(normX - start.x);
        const height = Math.abs(normY - start.y);
        if (width > 0.005 || height > 0.005) {
          pushNewAnnotation(
            {
              id: `anno_${Date.now()}`,
              type: 'rect',
              x,
              y,
              width,
              height,
              color: selectedColor,
              strokeWidth: penWidth,
              opacity: 1.0,
            },
            targetPage
          );
        }
      } else if (activeTool === 'circle') {
        const x = Math.min(start.x, normX);
        const y = Math.min(start.y, normY);
        const width = Math.abs(normX - start.x);
        const height = Math.abs(normY - start.y);
        if (width > 0.005 || height > 0.005) {
          pushNewAnnotation(
            {
              id: `anno_${Date.now()}`,
              type: 'circle',
              x,
              y,
              width,
              height,
              color: selectedColor,
              strokeWidth: penWidth,
              opacity: 1.0,
            },
            targetPage
          );
        }
      } else {
        const dist = Math.hypot(normX - start.x, normY - start.y);
        if (dist > 0.01) {
          pushNewAnnotation(
            {
              id: `anno_${Date.now()}`,
              type: activeTool,
              points: [start, { x: normX, y: normY }],
              color: selectedColor,
              strokeWidth: penWidth,
              opacity: 1.0,
            },
            targetPage
          );
        }
      }
    }
  };

  // Submit text annotation
  const handleAddText = () => {
    if (!textContent.trim()) {
      setTextModal({ x: 0, y: 0, isOpen: false, page: currentPage });
      return;
    }

    const targetPage = textModal.page || currentPage;
    pushNewAnnotation(
      {
        id: `anno_${Date.now()}`,
        type: 'text',
        x: textModal.x,
        y: textModal.y,
        text: textContent.trim(),
        color: selectedColor,
        fontSize: textSize,
        strokeWidth: 2,
        opacity: 1.0,
      },
      targetPage
    );

    setTextContent('');
    setTextModal({ x: 0, y: 0, isOpen: false, page: currentPage });
  };

  // -------------------------------------------------------------------------
  // 10. Export Annotated Document
  // -------------------------------------------------------------------------
  const handleExportAnnotated = async () => {
    setIsExporting(true);
    try {
      const docCanvas = docCanvasRef.current;
      const drawCanvas = drawCanvasRef.current;
      if (!docCanvas || !drawCanvas) return;

      // Merge base canvas + annotation overlay (if two-page mode, merge both pages side by side)
      const exportCanvas = document.createElement('canvas');
      const isTwoPage =
        effectiveViewMode === 'double' &&
        currentPage < numPages &&
        Boolean(docCanvas2Ref.current) &&
        Boolean(drawCanvas2Ref.current);

      if (isTwoPage) {
        const docCanvas2 = docCanvas2Ref.current!;
        const drawCanvas2 = drawCanvas2Ref.current!;
        const gap = 24;
        exportCanvas.width = docCanvas.width + docCanvas2.width + gap;
        exportCanvas.height = Math.max(docCanvas.height, docCanvas2.height);
        const exportCtx = exportCanvas.getContext('2d');
        if (!exportCtx) return;

        // Dark background for book spread
        exportCtx.fillStyle = '#0f172a';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Page 1
        exportCtx.drawImage(docCanvas, 0, 0);
        exportCtx.drawImage(drawCanvas, 0, 0);

        // Page 2
        exportCtx.drawImage(docCanvas2, docCanvas.width + gap, 0);
        exportCtx.drawImage(drawCanvas2, docCanvas.width + gap, 0);
      } else {
        exportCanvas.width = docCanvas.width;
        exportCanvas.height = docCanvas.height;
        const exportCtx = exportCanvas.getContext('2d');
        if (!exportCtx) return;

        exportCtx.drawImage(docCanvas, 0, 0);
        exportCtx.drawImage(drawCanvas, 0, 0);
      }

      // Download as high-resolution PNG
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const pageLabel = isTwoPage
          ? `Pages${currentPage}-${currentPage + 1}`
          : `Page${currentPage}`;
        a.download = `${note.title}_${pageLabel}_Annotated.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');
    } catch (e) {
      console.error('Export failed:', e);
      setIsExporting(false);
      alert('Failed to export annotated document.');
    }
  };

  // -------------------------------------------------------------------------
  // 11. Rename Note (Title & Subtitle)
  // -------------------------------------------------------------------------
  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitle.trim()) return;

    setIsRenaming(true);
    try {
      const updated = await updateNote(note.id, {
        title: renameTitle.trim(),
        subtitle: renameSubtitle.trim() || undefined,
      });
      if (onUpdate) onUpdate(updated);
      setIsRenameOpen(false);
    } catch (err) {
      alert('Failed to update title and subtitle');
    } finally {
      setIsRenaming(false);
    }
  };

  const canUndo =
    (history[currentPage]?.past?.length || 0) > 0 ||
    (effectiveViewMode === 'double' && (history[currentPage + 1]?.past?.length || 0) > 0);
  const canRedo =
    (history[currentPage]?.future?.length || 0) > 0 ||
    (effectiveViewMode === 'double' && (history[currentPage + 1]?.future?.length || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden font-sans">
      {/* ================= TOP TOOLBAR ================= */}
      <header className="h-16 px-4 bg-[hsl(var(--card))]/95 backdrop-blur-md border-b border-[hsl(var(--border))] flex items-center justify-between z-20 shrink-0 gap-3">
        {/* Left: Back, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              // Flush pending save before closing
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                savePageAnnotations(currentPage, pageAnnotations[currentPage] || []);
              }
              onClose();
            }}
            className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors shrink-0"
            title="Back to Notes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {note.title}
              </h2>
              <button
                onClick={() => setIsRenameOpen(true)}
                className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
                title="Edit Title & Subtitle"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {note.subtitle && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[240px] sm:max-w-sm">
                {note.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: PDF Page Navigation + View Mode Toggle */}
        {isPdf && numPages > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-[hsl(var(--muted))] px-2 py-1 rounded-xl border border-[hsl(var(--border))]">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  const step = effectiveViewMode === 'double' ? 2 : 1;
                  setCurrentPage((p) => Math.max(1, p - step));
                }}
                className="p-1 rounded text-[hsl(var(--foreground))] hover:opacity-75 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-[hsl(var(--foreground))] px-1 select-none min-w-[56px] text-center">
                {effectiveViewMode === 'double' && currentPage < numPages
                  ? `${currentPage}–${currentPage + 1} / ${numPages}`
                  : `${currentPage} / ${numPages}`}
              </span>
              <button
                disabled={
                  effectiveViewMode === 'double'
                    ? currentPage + 1 >= numPages
                    : currentPage >= numPages
                }
                onClick={() => {
                  const step = effectiveViewMode === 'double' ? 2 : 1;
                  setCurrentPage((p) => Math.min(numPages, p + step));
                }}
                className="p-1 rounded text-[hsl(var(--foreground))] hover:opacity-75 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View mode toggle (single / two-page) — only for multi-page PDFs */}
            {numPages > 1 && (
              <LayoutGroup id="doc-viewer-view-mode-tabs">
                <div className="relative flex items-center bg-[hsl(var(--muted))] p-0.5 rounded-xl border border-[hsl(var(--border))]">
                  <button
                    onClick={() => setViewMode('single')}
                    title="Single Page View"
                    className={cn(
                      'relative z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-150',
                      effectiveViewMode === 'single'
                        ? 'text-white font-semibold'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    )}
                  >
                    {effectiveViewMode === 'single' && (
                      <motion.div
                        layoutId="doc-view-mode-pill"
                        className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                      />
                    )}
                    <BookOpen className="relative z-10 w-3.5 h-3.5" />
                    <span className="relative z-10 hidden md:inline">Single</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('double');
                      // Ensure currentPage is odd so it pairs 1-2, 3-4, 5-6, etc.
                      setCurrentPage((p) => (p % 2 === 0 ? Math.max(1, p - 1) : p));
                    }}
                    title={
                      !isWideScreen
                        ? 'Two-page view (automatically falls back on small screens)'
                        : 'Two Pages Side-by-Side'
                    }
                    className={cn(
                      'relative z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-150',
                      effectiveViewMode === 'double'
                        ? 'text-white font-semibold'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    )}
                  >
                    {effectiveViewMode === 'double' && (
                      <motion.div
                        layoutId="doc-view-mode-pill"
                        className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                      />
                    )}
                    <Columns2 className="relative z-10 w-3.5 h-3.5" />
                    <span className="relative z-10 hidden md:inline">Two Pages</span>
                  </button>
                </div>
              </LayoutGroup>
            )}
          </div>
        )}

        {/* Right: Zoom, Save Status, Download & Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-[hsl(var(--muted))] p-1 rounded-xl border border-[hsl(var(--border))]">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-[hsl(var(--foreground))] w-11 text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(1.0)}
              className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card))] transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Autosave Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
            {saveStatus === 'saved' && (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 hidden md:inline">Saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                <span className="text-amber-600 dark:text-amber-400 hidden md:inline">Saving...</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <button
                  onClick={() =>
                    savePageAnnotations(currentPage, pageAnnotations[currentPage] || [])
                  }
                  className="text-rose-600 dark:text-rose-400 hover:underline hidden md:inline"
                >
                  Retry
                </button>
              </>
            )}
          </div>

          {/* Download Original File */}
          <a
            href={`/api/notes/${note.id}/file?download=true`}
            download={note.file_name}
            className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] transition-colors"
            title="Download Original File"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Export Annotated Document */}
          <button
            onClick={handleExportAnnotated}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            title="Export Annotated Page"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* ================= SECONDARY ANNOTATION TOOLBAR ================= */}
      <div className="px-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] flex items-center gap-2 overflow-x-auto select-none z-10 shrink-0 min-h-[52px] py-1.5">

        {/* GROUP A: Drawing tools */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTool('pen')}
            className={cn(
              'p-2 rounded-xl flex items-center gap-1 text-xs font-medium transition-all',
              activeTool === 'pen'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            )}
            title="Pen"
          >
            <Pen className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Pen</span>
          </button>

          <button
            onClick={() => setActiveTool('highlighter')}
            className={cn(
              'p-2 rounded-xl flex items-center gap-1 text-xs font-medium transition-all',
              activeTool === 'highlighter'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            )}
            title="Highlighter"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Highlight</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={cn(
              'p-2 rounded-xl flex items-center gap-1 text-xs font-medium transition-all',
              activeTool === 'eraser'
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] border border-[hsl(var(--ring))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            )}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Erase</span>
          </button>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[hsl(var(--border))] shrink-0" />

        {/* GROUP B: Shapes & text */}
        <div className="flex items-center gap-1 shrink-0">
          {[
            { tool: 'text' as const, icon: <Type className="w-3.5 h-3.5" />, label: 'Text' },
            { tool: 'rect' as const, icon: <Square className="w-3.5 h-3.5" />, label: 'Rect' },
            { tool: 'circle' as const, icon: <Circle className="w-3.5 h-3.5" />, label: 'Circle' },
            { tool: 'line' as const, icon: <Minus className="w-3.5 h-3.5" />, label: 'Line' },
            { tool: 'arrow' as const, icon: <MoveRight className="w-3.5 h-3.5" />, label: 'Arrow' },
          ].map(({ tool, icon, label }) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={cn(
                'p-2 rounded-xl transition-all',
                activeTool === tool
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[hsl(var(--border))] shrink-0" />

        {/* GROUP C: Color palette + thickness — context-sensitive */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTool === 'highlighter' ? (
            <>
              {HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setHighlighterColor(c.hex)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-transform',
                    highlighterColor === c.hex
                      ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1 ring-offset-[hsl(var(--card))]'
                      : 'hover:scale-110 opacity-80'
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              <div className="h-4 w-px bg-[hsl(var(--border))]" />
              <div className="flex items-center gap-0.5">
                {HIGHLIGHTER_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setHighlighterWidth(w)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors',
                      highlighterWidth === w
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </>
          ) : activeTool !== 'eraser' ? (
            <>
              {/* Current color swatch */}
              <div
                className="w-5 h-5 rounded-full border-2 border-[hsl(var(--border))] shrink-0"
                style={{ backgroundColor: selectedColor }}
                title={`Current color: ${selectedColor}`}
              />
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.hex)}
                  className={cn(
                    'w-4 h-4 rounded-full border border-[hsl(var(--border))] transition-transform',
                    selectedColor === c.hex
                      ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1 ring-offset-[hsl(var(--card))]'
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              <div className="h-4 w-px bg-[hsl(var(--border))]" />
              <div className="flex items-center gap-0.5">
                {PEN_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setPenWidth(w)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors',
                      penWidth === w
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] italic">Tap a stroke to erase</span>
          )}
        </div>

        {/* Spacer pushes edit actions to the right */}
        <div className="flex-1 min-w-3" />

        {/* GROUP D: Edit actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-25 transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-25 transition-colors"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-[hsl(var(--border))] shrink-0" />

          <button
            onClick={handleClearPage}
            className="p-2 rounded-xl text-rose-500/80 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
            title="Clear Current Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {isPdf && numPages > 1 && (
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className={cn(
                'p-2 rounded-xl transition-colors',
                isSidebarOpen
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
              title="Page Thumbnails"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= MAIN WORKSPACE & SIDE PANEL ================= */}
      <div className="flex-1 relative flex overflow-hidden bg-slate-200/70 dark:bg-slate-950">
        {/* Document Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4 sm:p-8 relative"
        >
          {isLoadingDoc && (
            <div className="flex flex-col items-center gap-3 text-slate-400 min-h-full justify-center flex">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading document...</p>
            </div>
          )}

          {docLoadError && (
            <div className="flex items-center justify-center min-h-full">
              <div className="p-6 max-w-md bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-rose-200 mb-1">Failed to open document</h3>
                <p className="text-xs text-rose-300 mb-4">{docLoadError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
                >
                  Reload Athena
                </button>
              </div>
            </div>
          )}

          {/* Canvas Wrapper — single page or two-page side by side */}
          <div
            className={cn(
              'flex items-start justify-center gap-4',
              (isLoadingDoc || docLoadError) && 'hidden'
            )}
            style={{
              cursor: activeTool === 'text' ? 'text' : 'crosshair',
            }}
          >
            {/* Page 1 (Current Page) */}
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white select-none shrink-0">
              <canvas ref={docCanvasRef} className="block pointer-events-none" />
              <canvas
                ref={drawCanvasRef}
                onPointerDown={(e) => handlePointerDown(e, currentPage)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="absolute inset-0 touch-none"
              />
            </div>

            {/* Page 2 — rendered in double-page mode when a second page exists */}
            {effectiveViewMode === 'double' && isPdf && currentPage < numPages && (
              <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white select-none shrink-0 border-l border-slate-300/40">
                <canvas ref={docCanvas2Ref} className="block pointer-events-none" />
                <canvas
                  ref={drawCanvas2Ref}
                  onPointerDown={(e) => handlePointerDown(e, currentPage + 1)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="absolute inset-0 touch-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Page Thumbnails Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && isPdf && numPages > 1 && (
            <motion.aside
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 bg-[hsl(var(--card))] border-l border-[hsl(var(--border))] p-4 flex flex-col gap-3 overflow-y-auto z-30 shrink-0"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[hsl(var(--border))]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Pages ({numPages})
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
                  const hasAnnotations = (pageAnnotations[p]?.length || 0) > 0;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        if (effectiveViewMode === 'double' && p % 2 === 0) {
                          setCurrentPage(p - 1);
                        } else {
                          setCurrentPage(p);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-xl border text-center transition-all',
                        currentPage === p ||
                          (effectiveViewMode === 'double' && currentPage + 1 === p)
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-sm ring-1 ring-indigo-500/30'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 hover:border-[hsl(var(--ring))]'
                      )}
                    >
                      <div className="w-full h-24 bg-[hsl(var(--muted))] rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] text-xs font-medium mb-1.5 relative overflow-hidden">
                        Page {p}
                        {hasAnnotations && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[hsl(var(--card))]" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                        p. {p}
                        {hasAnnotations && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">
                            ({pageAnnotations[p].length})
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ================= TEXT NOTE MODAL ================= */}
      <AnimatePresence>
        {textModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" /> Add Text Note
                </h3>
                <button
                  onClick={() => setTextModal((prev) => ({ ...prev, isOpen: false }))}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your study note here..."
                autoFocus
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400">Font Size:</span>
                <div className="flex items-center gap-1.5">
                  {[14, 18, 22, 28].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTextSize(s)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-mono font-medium',
                        textSize === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {s}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setTextModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddText}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Place Text
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= EDIT TITLE & SUBTITLE MODAL ================= */}
      <AnimatePresence>
        {isRenameOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">Edit Document Details</h3>
                <button
                  onClick={() => setIsRenameOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRename} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Subtitle / Topic Description
                  </label>
                  <input
                    type="text"
                    value={renameSubtitle}
                    onChange={(e) => setRenameSubtitle(e.target.value)}
                    placeholder="e.g. Chapter 4 Clinical Notes & Flowcharts"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRenameOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRenaming || !renameTitle.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
