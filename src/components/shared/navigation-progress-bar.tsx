'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setVisible(true);
    setProgress(28);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        // Decelerating crawl towards 85%
        const diff = 85 - prev;
        return prev + Math.max(1, diff * 0.15);
      });
    }, 120);
  }, []);

  const complete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }, []);

  // When pathname or searchParams change, mark navigation as complete
  useEffect(() => {
    complete();
  }, [pathname, searchParams, complete]);

  // Global click / pointerdown listener on internal links for instant 0ms touch feedback
  useEffect(() => {
    const handleNavigationTrigger = (e: MouseEvent | TouchEvent) => {
      // Find nearest link ancestor
      const target = (e.target as HTMLElement)?.closest?.('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      const isDownload = target.hasAttribute('download');

      // Ignore external links, downloads, new tabs, and anchor/hash links
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        targetAttr === '_blank' ||
        isDownload
      ) {
        return;
      }

      // If already on this exact path and hash, don't trigger
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      start();
    };

    // Listen on pointerdown so touch/click immediately triggers the loading bar with zero delay
    window.addEventListener('pointerdown', handleNavigationTrigger, { passive: true, capture: true });

    return () => {
      window.removeEventListener('pointerdown', handleNavigationTrigger, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [start]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2.5px] overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.7)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.15s ease-out' : 'width 0.2s ease',
        }}
      />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarContent />
    </Suspense>
  );
}
