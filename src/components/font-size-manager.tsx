'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';

export function FontSizeManager() {
  const fontSize = useSettingsStore((s) => s.settings.fontSize);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all font size classes
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    // Add the current one
    root.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  return null;
}
