'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, BookOpen, Calendar, Clock, BarChart, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const TUTORIAL_PAGES = [
  {
    title: 'Welcome to Athena',
    description: 'Your premium study management dashboard. Let\'s take a quick tour of what you can do here to boost your productivity.',
    icon: Target,
    color: '#6366f1'
  },
  {
    title: 'Dashboard Overview',
    description: 'Get a bird\'s-eye view of your overall completion, revision progress, daily streak, and tasks due today. Everything you need at a glance.',
    icon: Target,
    color: '#8b5cf6'
  },
  {
    title: 'Subject Tracking',
    description: 'Organize your learning by subjects, chapters, and topics. Track your completion percentage and never lose track of what to study next.',
    icon: BookOpen,
    color: '#14b8a6'
  },
  {
    title: 'Daily Planner & Tasks',
    description: 'Plan your day effectively. Add tasks, set priorities, and assign due dates to ensure you hit all your study goals on time.',
    icon: Calendar,
    color: '#f97316'
  },
  {
    title: 'Revision Tracker',
    description: 'Spaced repetition made easy. Track topics that need revision to ensure long-term retention of your study material.',
    icon: Clock,
    color: '#ec4899'
  },
  {
    title: 'Detailed Analytics',
    description: 'Visualize your progress. View beautiful charts showing your study minutes over time and analyze your weekly productivity.',
    icon: BarChart,
    color: '#3b82f6'
  },
  {
    title: 'Customize Your Experience',
    description: 'Tweak Athena to fit your style. Head over to settings to adjust themes, font sizes, and manage your data.',
    icon: Settings,
    color: '#64748b'
  }
];

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalPages = TUTORIAL_PAGES.length;

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('athena-tutorial-seen');
    if (!hasSeenTutorial) {
      // Small delay to let the app load before showing tutorial
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setInterval(() => {
      setCurrentPage((prev) => {
        if (prev === totalPages - 1) {
          // If at the end, just stop auto-navigating
          setIsPaused(true);
          return prev;
        }
        return prev + 1;
      });
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [isOpen, isPaused, totalPages]);

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('athena-tutorial-seen', 'true');
  };

  const handleFinish = () => {
    setIsOpen(false);
    localStorage.setItem('athena-tutorial-seen', 'true');
  };

  const goToNext = () => {
    setIsPaused(true);
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const goToPrev = () => {
    setIsPaused(true);
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  if (!isOpen) return null;

  const currentSlide = TUTORIAL_PAGES[currentPage];
  const Icon = currentSlide.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="relative w-full max-w-xl overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-2xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-0.5 bg-[hsl(var(--muted))]">
            {TUTORIAL_PAGES.map((_, idx) => (
              <div key={idx} className="flex-1 h-full relative">
                {idx < currentPage && (
                  <div className="absolute inset-0 bg-indigo-500" />
                )}
                {idx === currentPage && (
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-indigo-500"
                    initial={{ width: isPaused ? '100%' : '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      duration: isPaused ? 0 : 5, 
                      ease: "linear" 
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <motion.div
                key={currentPage + '-icon'}
                initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{ backgroundColor: `${currentSlide.color}20`, color: currentSlide.color }}
              >
                <Icon className="w-10 h-10" />
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage + '-text'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 min-h-[140px]"
                >
                  <h2 className="text-2xl font-bold tracking-tight">
                    {currentSlide.title}
                  </h2>
                  <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {currentSlide.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-[hsl(var(--muted))]/50 border-t border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                disabled={currentPage === 0}
                className="p-2 rounded-full hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium text-[hsl(var(--muted-foreground))] min-w-[3rem] text-center">
                {currentPage + 1} / {totalPages}
              </div>
              <button
                onClick={goToNext}
                disabled={currentPage === totalPages - 1}
                className="p-2 rounded-full hover:bg-[hsl(var(--muted))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSkip}
                className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Skip Tutorial
              </button>
              {currentPage === totalPages - 1 ? (
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  Get Started
                </button>
              ) : (
                <button
                  onClick={goToNext}
                  className="px-6 py-2.5 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 text-sm font-medium rounded-xl transition-all active:scale-95"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
