import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-[hsl(var(--muted))]', className)}
    />
  );
}

export function PageLoader({
  label = 'Loading page',
  variant = 'dashboard',
  className,
}: {
  label?: string;
  variant?: 'dashboard' | 'cards' | 'settings' | 'analytics' | 'detail';
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn('mx-auto w-full max-w-7xl space-y-6', className)}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[hsl(var(--primary))]/25 border-t-[hsl(var(--primary))]" />
        {label}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </div>

      {variant === 'settings' ? (
        <div className="mx-auto max-w-2xl space-y-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : variant === 'analytics' ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </>
      ) : variant === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : variant === 'detail' ? (
        <>
          <Skeleton className="h-40 rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" />
            ))}
          </div>
        </>
      ) : (
        <>
          <Skeleton className="h-56 rounded-3xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </>
      )}
    </div>
  );
}

export function SectionLoader({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" className={cn('space-y-3', className)}>
      <span className="sr-only">Loading content</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export function CardGridLoader({
  cards = 6,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      <span className="sr-only">Loading cards</span>
      {Array.from({ length: cards }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3"
        >
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

