'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, Loader2, type LucideIcon } from 'lucide-react';
import { useAcademicYearStore } from '@/store/academic-year-store';
import { cn } from '@/lib/utils';

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
  year_2: {
    icon: GraduationCap,
    badge: '2nd',
    activeBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
    activeShadow: 'shadow-lg shadow-emerald-500/25',
    activeBadge: 'bg-emerald-500/30 text-white border-emerald-300/40',
    inactiveIcon: 'text-emerald-500/80 group-hover:text-emerald-400 group-hover:scale-110 transition-transform',
    inactiveHoverText: 'hover:text-emerald-400',
    inactiveHoverBg: 'hover:bg-emerald-500/10',
    inactiveBadge: 'text-emerald-500/90 border-emerald-500/30 bg-emerald-500/5',
    dotColor: 'bg-emerald-400',
  },
  year_3: {
    icon: Sparkles,
    badge: '3rd',
    activeBg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
    activeShadow: 'shadow-lg shadow-purple-500/25',
    activeBadge: 'bg-purple-500/30 text-white border-purple-300/40',
    inactiveIcon: 'text-purple-500/80 group-hover:text-purple-400 group-hover:scale-110 transition-transform',
    inactiveHoverText: 'hover:text-purple-400',
    inactiveHoverBg: 'hover:bg-purple-500/10',
    inactiveBadge: 'text-purple-500/90 border-purple-500/30 bg-purple-500/5',
    dotColor: 'bg-purple-400',
  },
};

const DEFAULT_THEME: YearTheme = {
  icon: GraduationCap,
  badge: 'Yr',
  activeBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
  activeShadow: 'shadow-lg shadow-indigo-500/25',
  activeBadge: 'bg-white/20 text-white border-white/30',
  inactiveIcon: 'text-indigo-400 group-hover:scale-110 transition-transform',
  inactiveHoverText: 'hover:text-indigo-400',
  inactiveHoverBg: 'hover:bg-indigo-500/10',
  inactiveBadge: 'text-indigo-400 border-indigo-500/30',
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
  const { years, activeYearId, setActiveYearId, isSwitching } = useAcademicYearStore();

  return (
    <div className="space-y-1">
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
              Academic Year
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Year buttons inline with other navbar buttons */}
      {years.map((year) => {
        const theme = YEAR_THEMES[year.id] || DEFAULT_THEME;
        const Icon = theme.icon;
        const isActive = activeYearId === year.id;

        return (
          <button
            key={year.id}
            type="button"
            onClick={() => setActiveYearId(year.id)}
            disabled={isSwitching}
            title={year.name}
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative w-full text-left',
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
                className={cn('absolute inset-0 rounded-xl', theme.activeBg, theme.activeShadow)}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}

            {/* Icon */}
            {isSwitching && isActive ? (
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
    </div>
  );
}

/**
 * AcademicYearMobileBadge
 * Compact colorful pill for mobile header that lets the user toggle years with vibrant highlighting.
 */
export function AcademicYearMobileBadge() {
  const { years, activeYearId, setActiveYearId, isSwitching } = useAcademicYearStore();

  const nextYear = years.find((y) => y.id !== activeYearId) || years[0];
  const activeYear = years.find((y) => y.id === activeYearId) || years[0];
  const activeTheme = (activeYear && YEAR_THEMES[activeYear.id]) || DEFAULT_THEME;
  const ActiveIcon = activeTheme.icon;

  if (!activeYear) return null;

  return (
    <button
      type="button"
      onClick={() => nextYear && setActiveYearId(nextYear.id)}
      disabled={isSwitching}
      title={`Current: ${activeYear.name}. Tap to switch to ${nextYear?.name || 'next year'}`}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-transform active:scale-95',
        activeTheme.activeBg,
        activeTheme.activeShadow
      )}
    >
      {isSwitching ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <ActiveIcon className="w-3.5 h-3.5 text-white" />
      )}
      <span>{activeYear.name}</span>
    </button>
  );
}
