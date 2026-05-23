'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to prevent hydration mismatches with Zustand persisted stores.
 * Returns true only after the component has mounted on the client.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
