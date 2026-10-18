'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  X,
  Sliders,
  Layers,
  Edit2,
  Eye,
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

  // Text tool prompt modal state
  const [textModal, setTextModal] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
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

  // -------------------------------------------------------------------------
  // 3. Render Page (PDF or Image) onto docCanvasRef
  // -------------------------------------------------------------------------
  const renderDocumentPage = useCallback(async () => {
    const docCanvas = docCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!docCanvas || !drawCanvas) return;

    if (isPdf) {
      if (!pdfDoc) return;
      try {
        // Cancel existing render if any
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {
            // ignore cancel error
          }
        }

        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale * 1.5 });

        // Set dimensions (accounting for devicePixelRatio for ultra-sharp text)
        docCanvas.width = viewport.width;
        docCanvas.height = viewport.height;
        docCanvas.style.width = `${viewport.width / 1.5}px`;
        docCanvas.style.height = `${viewport.height / 1.5}px`;

        drawCanvas.width = viewport.width;
        drawCanvas.height = viewport.height;
        drawCanvas.style.width = `${viewport.width / 1.5}px`;
        drawCanvas.style.height = `${viewport.height / 1.5}px`;

        const ctx = docCanvas.getContext('2d');
        if (!ctx) return;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
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
  }, [isPdf, pdfDoc, currentPage, zoomScale, fileUrl]);

  // -------------------------------------------------------------------------
  // 4. Draw page annotations onto drawCanvasRef
  // -------------------------------------------------------------------------
  const redrawAnnotations = useCallback(() => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    const items = pageAnnotations[currentPage] || [];
    const w = drawCanvas.width;
    const h = drawCanvas.height;

    for (const item of items) {
      renderAnnotationItem(ctx, item, w, h);
    }
  }, [currentPage, pageAnnotations]);

  // Trigger render on page / zoom change
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
    (item: AnnotationItem) => {
      const currentList = pageAnnotations[currentPage] || [];
      const updatedList = [...currentList, item];

      // Update history for Undo/Redo
      const curHistory = history[currentPage] || { past: [], future: [] };
      setHistory((prev) => ({
        ...prev,
        [currentPage]: {
          past: [...curHistory.past, currentList],
          future: [],
        },
      }));

      // Update annotations state
      setPageAnnotations((prev) => ({
        ...prev,
        [currentPage]: updatedList,
      }));

      // Autosave
      triggerAutosave(currentPage, updatedList);
    },
    [currentPage, pageAnnotations, history, triggerAutosave]
  );

  const handleUndo = useCallback(() => {
    const curHistory = history[currentPage];
    if (!curHistory || curHistory.past.length === 0) return;

    const previousState = curHistory.past[curHistory.past.length - 1];
    const newPast = curHistory.past.slice(0, curHistory.past.length - 1);
    const currentList = pageAnnotations[currentPage] || [];

    setHistory((prev) => ({
      ...prev,
      [currentPage]: {
        past: newPast,
        future: [currentList, ...curHistory.future],
      },
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [currentPage]: previousState,
    }));

    triggerAutosave(currentPage, previousState);
  }, [currentPage, history, pageAnnotations, triggerAutosave]);

  const handleRedo = useCallback(() => {
    const curHistory = history[currentPage];
    if (!curHistory || curHistory.future.length === 0) return;

    const nextState = curHistory.future[0];
    const newFuture = curHistory.future.slice(1);
    const currentList = pageAnnotations[currentPage] || [];

    setHistory((prev) => ({
      ...prev,
      [currentPage]: {
        past: [...curHistory.past, currentList],
        future: newFuture,
      },
    }));

    setPageAnnotations((prev) => ({
      ...prev,
      [currentPage]: nextState,
    }));

    triggerAutosave(currentPage, nextState);
  }, [currentPage, history, pageAnnotations, triggerAutosave]);

  const handleClearPage = useCallback(() => {
    if (confirm('Clear all annotations on this page?')) {
      const currentList = pageAnnotations[currentPage] || [];
      const curHistory = history[currentPage] || { past: [], future: [] };

      setHistory((prev) => ({
        ...prev,
        [currentPage]: {
          past: [...curHistory.past, currentList],
          future: [],
        },
      }));

      setPageAnnotations((prev) => ({
        ...prev,
        [currentPage]: [],
      }));

      triggerAutosave(currentPage, []);
    }
  }, [currentPage, pageAnnotations, history, triggerAutosave]);

  // -------------------------------------------------------------------------
  // 8. Eraser tool: Remove strokes / shapes on click or swipe
  // -------------------------------------------------------------------------
  const eraseNearPoint = useCallback(
    (normX: number, normY: number) => {
      const items = pageAnnotations[currentPage] || [];
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
        const curHistory = history[currentPage] || { past: [], future: [] };
        setHistory((prev) => ({
          ...prev,
          [currentPage]: {
            past: [...curHistory.past, items],
            future: [],
          },
        }));

        setPageAnnotations((prev) => ({
          ...prev,
          [currentPage]: remaining,
        }));

        triggerAutosave(currentPage, remaining);
      }
    },
    [currentPage, pageAnnotations, history, triggerAutosave]
  );

  // -------------------------------------------------------------------------
  // 9. Pointer Event Handlers for Drawing & Shapes
  // -------------------------------------------------------------------------
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, normX: 0, normY: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const normY = Math.max(0, Math.min(1, clientY / rect.height));

    return { x: clientX, y: clientY, normX, normY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { normX, normY } = getCanvasCoords(e);

    if (activeTool === 'eraser') {
      isDrawingRef.current = true;
      eraseNearPoint(normX, normY);
      return;
    }

    if (activeTool === 'text') {
      setTextModal({ x: normX, y: normY, isOpen: true });
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

    if (activeTool === 'eraser') {
      eraseNearPoint(normX, normY);
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      currentPointsRef.current.push({ x: normX, y: normY });

      // Immediate visual preview of the active freehand stroke
      const drawCanvas = drawCanvasRef.current;
      if (!drawCanvas) return;
      const ctx = drawCanvas.getContext('2d');
      if (!ctx) return;

      // Redraw existing plus current in-flight stroke
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
        drawCanvas.width,
        drawCanvas.height
      );
      return;
    }

    // Dynamic shape preview while dragging
    if (['rect', 'circle', 'line', 'arrow'].includes(activeTool) && startPointRef.current) {
      const drawCanvas = drawCanvasRef.current;
      if (!drawCanvas) return;
      const ctx = drawCanvas.getContext('2d');
      if (!ctx) return;

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

      renderAnnotationItem(ctx, tempItem, drawCanvas.width, drawCanvas.height);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const { normX, normY } = getCanvasCoords(e);

    if (activeTool === 'eraser') return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      if (currentPointsRef.current.length > 0) {
        pushNewAnnotation({
          id: `anno_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: activeTool,
          points: [...currentPointsRef.current],
          color: activeTool === 'pen' ? selectedColor : highlighterColor,
          strokeWidth: activeTool === 'pen' ? penWidth : highlighterWidth,
          opacity: activeTool === 'pen' ? 1.0 : 0.35,
        });
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
          pushNewAnnotation({
            id: `anno_${Date.now()}`,
            type: 'rect',
            x,
            y,
            width,
            height,
            color: selectedColor,
            strokeWidth: penWidth,
            opacity: 1.0,
          });
        }
      } else if (activeTool === 'circle') {
        const x = Math.min(start.x, normX);
        const y = Math.min(start.y, normY);
        const width = Math.abs(normX - start.x);
        const height = Math.abs(normY - start.y);
        if (width > 0.005 || height > 0.005) {
          pushNewAnnotation({
            id: `anno_${Date.now()}`,
            type: 'circle',
            x,
            y,
            width,
            height,
            color: selectedColor,
            strokeWidth: penWidth,
            opacity: 1.0,
          });
        }
      } else {
        const dist = Math.hypot(normX - start.x, normY - start.y);
        if (dist > 0.01) {
          pushNewAnnotation({
            id: `anno_${Date.now()}`,
            type: activeTool,
            points: [start, { x: normX, y: normY }],
            color: selectedColor,
            strokeWidth: penWidth,
            opacity: 1.0,
          });
        }
      }
    }
  };

  // Submit text annotation
  const handleAddText = () => {
    if (!textContent.trim()) {
      setTextModal({ x: 0, y: 0, isOpen: false });
      return;
    }

    pushNewAnnotation({
      id: `anno_${Date.now()}`,
      type: 'text',
      x: textModal.x,
      y: textModal.y,
      text: textContent.trim(),
      color: selectedColor,
      fontSize: textSize,
      strokeWidth: 2,
      opacity: 1.0,
    });

    setTextContent('');
    setTextModal({ x: 0, y: 0, isOpen: false });
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

      // Merge base canvas + annotation overlay
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = docCanvas.width;
      exportCanvas.height = docCanvas.height;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return;

      exportCtx.drawImage(docCanvas, 0, 0);
      exportCtx.drawImage(drawCanvas, 0, 0);

      // Download as high-resolution PNG
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title}_Page${currentPage}_Annotated.png`;
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

  const canUndo = (history[currentPage]?.past?.length || 0) > 0;
  const canRedo = (history[currentPage]?.future?.length || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ================= TOP TOOLBAR ================= */}
      <header className="h-16 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20 shrink-0 gap-3">
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
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Back to Notes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {note.title}
              </h2>
              <button
                onClick={() => setIsRenameOpen(true)}
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                title="Edit Title & Subtitle"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {note.subtitle && (
              <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-sm">
                {note.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: PDF Page Navigation */}
        {isPdf && numPages > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 shrink-0">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-300 px-1 select-none">
              {currentPage} / {numPages}
            </span>
            <button
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Zoom, Save Status, Download & Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-300 w-11 text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(1.0)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Autosave Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/60 border border-slate-700/50">
            {saveStatus === 'saved' && (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 hidden md:inline">Saved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-400 hidden md:inline">Saving...</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <button
                  onClick={() =>
                    savePageAnnotations(currentPage, pageAnnotations[currentPage] || [])
                  }
                  className="text-rose-400 hover:underline hidden md:inline"
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
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
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
      <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto select-none z-10 shrink-0">
        {/* Left: Annotation Tools Palette */}
        <div className="flex items-center gap-1.5">
          {/* Pen */}
          <button
            onClick={() => setActiveTool('pen')}
            className={cn(
              'p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all',
              activeTool === 'pen'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
            title="Pen (Freehand Drawing)"
          >
            <Pen className="w-4 h-4" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          {/* Highlighter */}
          <button
            onClick={() => setActiveTool('highlighter')}
            className={cn(
              'p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all',
              activeTool === 'highlighter'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
            title="Highlighter (Translucent)"
          >
            <Highlighter className="w-4 h-4" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={cn(
              'p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all',
              activeTool === 'eraser'
                ? 'bg-slate-700 text-white border border-slate-500 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
            title="Eraser (Erase annotations)"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* Shapes & Text */}
          <button
            onClick={() => setActiveTool('text')}
            className={cn(
              'p-2 rounded-xl text-slate-400 hover:text-white transition-all',
              activeTool === 'text'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'hover:bg-slate-800'
            )}
            title="Add Text Note"
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('rect')}
            className={cn(
              'p-2 rounded-xl text-slate-400 hover:text-white transition-all',
              activeTool === 'rect'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'hover:bg-slate-800'
            )}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('circle')}
            className={cn(
              'p-2 rounded-xl text-slate-400 hover:text-white transition-all',
              activeTool === 'circle'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'hover:bg-slate-800'
            )}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('line')}
            className={cn(
              'p-2 rounded-xl text-slate-400 hover:text-white transition-all',
              activeTool === 'line'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'hover:bg-slate-800'
            )}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('arrow')}
            className={cn(
              'p-2 rounded-xl text-slate-400 hover:text-white transition-all',
              activeTool === 'arrow'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'hover:bg-slate-800'
            )}
            title="Arrow"
          >
            <MoveRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Color & Thickness pickers */}
        <div className="flex items-center gap-3">
          {activeTool === 'highlighter' ? (
            <div className="flex items-center gap-1.5">
              {HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setHighlighterColor(c.hex)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-transform',
                    highlighterColor === c.hex
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-110 opacity-80'
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              <div className="h-4 w-[1px] bg-slate-800 mx-1" />
              <div className="flex items-center gap-1">
                {HIGHLIGHTER_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setHighlighterWidth(w)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors',
                      highlighterWidth === w
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeTool !== 'eraser' && (
              <div className="flex items-center gap-1.5">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.hex)}
                    className={cn(
                      'w-5 h-5 rounded-full border border-slate-700 transition-transform',
                      selectedColor === c.hex
                        ? 'scale-125 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900'
                        : 'hover:scale-110 opacity-80'
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <div className="flex items-center gap-1">
                  {PEN_WIDTHS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setPenWidth(w)}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors',
                        penWidth === w
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Right: Undo, Redo, Clear Page, Thumbnails Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={handleClearPage}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            title="Clear Current Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isPdf && numPages > 1 && (
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className={cn(
                'p-2 rounded-xl transition-colors',
                isSidebarOpen
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
              title="Page Thumbnails"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= MAIN WORKSPACE & SIDE PANEL ================= */}
      <div className="flex-1 relative flex overflow-hidden bg-slate-950">
        {/* Document Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative"
        >
          {isLoadingDoc && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading document...</p>
            </div>
          )}

          {docLoadError && (
            <div className="p-6 max-w-md bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-rose-200 mb-1">
                Failed to open document
              </h3>
              <p className="text-xs text-rose-300 mb-4">{docLoadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Reload Athena
              </button>
            </div>
          )}

          {/* Canvas Wrapper */}
          <div
            className={cn(
              'relative shadow-2xl rounded-lg overflow-hidden bg-white select-none transition-transform duration-75',
              (isLoadingDoc || docLoadError) && 'hidden'
            )}
            style={{
              cursor:
                activeTool === 'eraser'
                  ? 'crosshair'
                  : activeTool === 'text'
                  ? 'text'
                  : 'crosshair',
            }}
          >
            {/* Base Document Canvas */}
            <canvas ref={docCanvasRef} className="block pointer-events-none" />

            {/* Interactive Annotation Canvas Overlay */}
            <canvas
              ref={drawCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="absolute inset-0 touch-none"
            />
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
              className="w-72 bg-slate-900 border-l border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto z-30 shrink-0"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Pages ({numPages})
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
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
                      onClick={() => setCurrentPage(p)}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-xl border text-center transition-all',
                        currentPage === p
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                          : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      )}
                    >
                      <div className="w-full h-24 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs font-medium mb-1.5 relative overflow-hidden">
                        Page {p}
                        {hasAnnotations && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-300">
                        p. {p}
                        {hasAnnotations && (
                          <span className="text-[10px] text-emerald-400 ml-1">
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
                  onClick={() => setTextModal({ x: 0, y: 0, isOpen: false })}
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
                  onClick={() => setTextModal({ x: 0, y: 0, isOpen: false })}
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
