'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Scroll, Stethoscope, GraduationCap, BookOpen, Loader2, type LucideIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { cn } from '@/lib/utils';
import { subjectListHref } from '@/lib/routes';

function useAcademicYearSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const activeYearId = useAcademicYearStore((state) => state.activeYearId);
  const setActiveYearId = useAcademicYearStore((state) => state.setActiveYearId);

  return async (yearId: string) => {
    const leavingSubjectDetail = /^\/(?:subjects|revisions)\/[^/]+\/?$/.test(pathname) && yearId !== activeYearId;
    await setActiveYearId(yearId);
    if (leavingSubjectDetail) router.replace(subjectListHref());
  };
}

interface YearTheme {
  icon: LucideIcon;
  badge: string;
  activeBg: string;
  activeShadow: string;
  activeBadge: string;
  inactiveIcon: string;
  inactiveHoverText: string;
  inactiveHoverBg: string;
  inactiveBadge: string;
  dotColor: string;
}

const YEAR_THEMES: Record<string, YearTheme> = {
  year_1: {
    icon: BookOpen,
    badge: '1st',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    activeShadow: 'shadow-md shadow-emerald-500/25',
    activeBadge: 'bg-white/20 text-white border-white/30',
    inactiveIcon: 'text-[hsl(var(--muted-foreground))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors',
    inactiveHoverText: 'hover:text-[hsl(var(--foreground))]',
    inactiveHoverBg: 'hover:bg-[hsl(var(--accent))]',
    inactiveBadge: 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50',
    dotColor: 'bg-emerald-400',
  },
  year_2: {
    icon: Scroll,
    badge: '2nd',
    activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    activeShadow: 'shadow-md shadow-blue-500/25',
    activeBadge: 'bg-white/20 text-white border-white/30',
    inactiveIcon: 'text-[hsl(var(--muted-foreground))] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors',
    inactiveHoverText: 'hover:text-[hsl(var(--foreground))]',
    inactiveHoverBg: 'hover:bg-[hsl(var(--accent))]',
    inactiveBadge: 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50',
    dotColor: 'bg-blue-400',
  },
  year_3: {
    icon: Stethoscope,
    badge: '3rd',
    activeBg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700',
    activeShadow: 'shadow-md shadow-purple-500/25',
    activeBadge: 'bg-white/20 text-white border-white/30',
    inactiveIcon: 'text-[hsl(var(--muted-foreground))] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors',
    inactiveHoverText: 'hover:text-[hsl(var(--foreground))]',
    inactiveHoverBg: 'hover:bg-[hsl(var(--accent))]',
    inactiveBadge: 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50',
    dotColor: 'bg-purple-400',
  },
};

const DEFAULT_THEME: YearTheme = {
  icon: GraduationCap,
  badge: 'Yr',
  activeBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
  activeShadow: 'shadow-md shadow-indigo-500/20',
  activeBadge: 'bg-white/20 text-white border-white/30',
  inactiveIcon: 'text-[hsl(var(--muted-foreground))] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors',
  inactiveHoverText: 'hover:text-[hsl(var(--foreground))]',
  inactiveHoverBg: 'hover:bg-[hsl(var(--accent))]',
  inactiveBadge: 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50',
  dotColor: 'bg-indigo-400',
};

/**
 * AcademicYearNavSection
 * Renders inline with standard navbar items, below them after a divider line.
 * Each year has its own distinct, colorful styling and highlighting.
 */
export function AcademicYearNavSection({
  collapsed,
  idPrefix = 'desktop',
}: {
  collapsed: boolean;
  idPrefix?: string;
}) {
  const { years, activeYearId, isLoading, isSwitching } = useAcademicYearStore();
  const switchYear = useAcademicYearSwitch();

  return (
    <div className="space-y-1" role="group" aria-label="Under Graduate (UG)">
      {/* Divider line */}
      <div className="pt-3 pb-2 px-1">
        <div className="border-t border-[hsl(var(--border))]" />
      </div>

      {/* Section label (visible when expanded) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-1 overflow-hidden"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Under Graduate (UG)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Year buttons inline with other navbar buttons */}
      <LayoutGroup id={`${idPrefix}-academic-years`}>
        {years.map((year) => {
          const theme = YEAR_THEMES[year.id] || DEFAULT_THEME;
          const Icon = theme.icon;
          const isActive = activeYearId === year.id;

          return (
            <button
              key={year.id}
              type="button"
              onClick={() => void switchYear(year.id)}
              disabled={isSwitching}
              title={year.name}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative w-full text-left select-none',
                isActive
                  ? 'text-white'
                  : cn(
                      'text-[hsl(var(--muted-foreground))]',
                      theme.inactiveHoverText,
                      theme.inactiveHoverBg
                    )
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={`${idPrefix}-year-active-pill`}
                  className={cn('absolute inset-0 rounded-xl ring-1 ring-white/15', theme.activeBg, theme.activeShadow)}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.8,
                  }}
                />
              )}

            {/* Icon */}
            {(isLoading || isSwitching) && isActive ? (
              <Loader2 className="w-[18px] h-[18px] shrink-0 relative z-10 animate-spin text-white" />
            ) : (
              <Icon
                className={cn(
                  'w-[18px] h-[18px] shrink-0 relative z-10',
                  isActive ? 'text-white' : theme.inactiveIcon
                )}
              />
            )}

            {/* Label and badge (when expanded) */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="relative z-10 flex items-center justify-between flex-1 min-w-0 overflow-hidden"
                >
                  <span className="whitespace-nowrap font-medium">{year.name}</span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 uppercase tracking-tight',
                      isActive ? theme.activeBadge : theme.inactiveBadge
                    )}
                  >
                    {theme.badge}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        );
      })}
      </LayoutGroup>
    </div>
  );
}

/**
 * AcademicYearMobileBadge
 * Compact colorful pill for mobile header that lets the user toggle years with vibrant highlighting.
 */
export function AcademicYearMobileBadge() {
  const { years, activeYearId, isLoading, isSwitching } = useAcademicYearStore();
  const switchYear = useAcademicYearSwitch();

  const orderedYears = [...years].sort((left, right) => left.order_index - right.order_index);
  const activeYearIndex = orderedYears.findIndex((year) => year.id === activeYearId);
  const activeYear = orderedYears[activeYearIndex] || orderedYears[0];
  const nextYear = orderedYears[(activeYearIndex + 1) % orderedYears.length] || orderedYears[0];
  const activeTheme = (activeYear && YEAR_THEMES[activeYear.id]) || DEFAULT_THEME;
  const ActiveIcon = activeTheme.icon;

  if (!activeYear) return null;

  return (
    <button
      type="button"
      onClick={() => nextYear && void switchYear(nextYear.id)}
      disabled={isSwitching}
      title={`Current: ${activeYear.name}. Tap to switch to ${nextYear?.name || 'next year'}`}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-transform active:scale-95',
        activeTheme.activeBg,
        activeTheme.activeShadow
      )}
    >
      {isLoading || isSwitching ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <ActiveIcon className="w-3.5 h-3.5 text-white" />
      )}
      <span>{activeYear.name}</span>
    </button>
  );
}
