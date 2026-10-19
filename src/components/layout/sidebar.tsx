'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  RotateCcw,
  CheckSquare,
  BarChart3,
  Settings,
  GraduationCap,
  ChevronLeft,
  Menu,
  Moon,
  // Activity, // Kept for future use (Human Anatomy Lab)
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AcademicYearNavSection, AcademicYearMobileBadge } from './academic-year-selector';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/planner', label: 'Daily Planner', icon: CalendarDays },
  { href: '/notes', label: 'Notes', icon: FileText },
  // { href: '/anatomy', label: 'Human Anatomy', icon: Activity }, // Kept for future use
  { href: '/revisions', label: 'Revisions', icon: RotateCcw },
  { href: '/exams', label: 'Exams', icon: GraduationCap },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useState(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync optimistic path when route changes through browser history
  useEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname]);

  const isActive = (href: string) => {
    const current = optimisticPath;
    if (href === '/') return current === '/';
    if (href === '/planner') return current === '/planner' || current === '/tasks';
    return current.startsWith(href);
  };

  const getSidebarContent = (idPrefix: string) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--border))]">
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <img src="/logo.svg" alt="Athena Logo" className="w-8 h-8 object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-base font-bold whitespace-nowrap bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Athena
              </h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                Wisdom in every session
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <LayoutGroup id={`${idPrefix}-sidebar-nav`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOptimisticPath(item.href);
                  setMobileOpen(false);
                }}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative select-none',
                  active
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId={`${idPrefix}-sidebar-active`}
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/15"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 32,
                      mass: 0.8,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0 relative z-10 transition-transform duration-200',
                    active
                      ? 'text-white scale-105'
                      : 'text-[hsl(var(--muted-foreground))] group-hover:scale-105'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        'relative z-10 whitespace-nowrap overflow-hidden',
                        active ? 'font-semibold text-white' : 'font-medium'
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </LayoutGroup>

        {/* Academic Year Navigation Section - Inline below items after divider line */}
        <AcademicYearNavSection collapsed={collapsed} idPrefix={idPrefix} />
      </nav>

      {/* Collapse button - desktop only */}
      <div className="hidden lg:block px-3 py-4 border-t border-[hsl(var(--border))]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all duration-200 w-full"
        >
          <ChevronLeft className={cn('w-[18px] h-[18px] transition-transform duration-300', collapsed && 'rotate-180')} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top controls */}
      <div className="lg:hidden fixed top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => setMobileOpen(true)}
          className="pointer-events-auto p-2.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="pointer-events-auto">
          <AcademicYearMobileBadge />
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] z-50 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] shadow-2xl"
          >
            {getSidebarContent('mobile')}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="hidden lg:block fixed left-0 top-0 bottom-0 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-30 overflow-hidden"
      >
        {getSidebarContent('desktop')}
      </motion.aside>

      {/* Spacer for desktop */}
      <motion.div
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="hidden lg:block shrink-0"
      />
    </>
  );
}
