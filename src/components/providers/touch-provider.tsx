'use client';

import { useEffect } from 'react';

/**
 * TouchProvider ensures that mobile & touch devices (especially iOS Safari / WebKit)
 * immediately trigger CSS `:active` states on finger press without delay, and disables
 * lingering touch artifacts.
 */
export function TouchProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // iOS Safari requires a touchstart listener on window or document to activate the CSS :active pseudo-class
    const handleTouchStart = () => {};
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return <>{children}</>;
}
