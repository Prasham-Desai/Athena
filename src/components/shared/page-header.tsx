'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8 min-w-0', className)}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight break-words">{title}</h1>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5 break-words">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </motion.div>
  );
}
