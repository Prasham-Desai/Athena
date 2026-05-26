'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-[hsl(var(--muted-foreground))]">
          An unexpected error occurred while loading this page.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-2.5 text-sm font-medium hover:bg-[hsl(var(--muted))] transition"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
