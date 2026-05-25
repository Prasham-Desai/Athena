'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Download, Upload, Trash2, Clock, Target, Type } from 'lucide-react';
import { useTheme } from 'next-themes';
import { defaultSettings, useSettingsStore } from '@/store/settings-store';
import { useSubjectsStore } from '@/store/subjects-store';
import { usePlannerStore } from '@/store/planner-store';
import { useTasksStore } from '@/store/tasks-store';
import { useActivityStore } from '@/store/activity-store';
import { useHydration } from '@/hooks/use-hydration';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function SettingsSection({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6"
    >
      <h3 className="text-base font-semibold mb-0.5">{title}</h3>
      {description && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5">{description}</p>
      )}
      {!description && <div className="mb-5" />}
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const hydrated = useHydration();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { subjects, setSubjects } = useSubjectsStore();
  const { studyBlocks, setStudyBlocks } = usePlannerStore();
  const { tasks, setTasks } = useTasksStore();
  const { activities, dailyLogs, setActivities, setDailyLogs } = useActivityStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Export ----
  const handleExport = () => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      subjects,
      studyBlocks,
      tasks,
      activities,
      dailyLogs,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: 'Data exported successfully!', type: 'success' } }),
    );
  };

  // ---- Import ----
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.subjects) setSubjects(data.subjects);
        if (data.studyBlocks) setStudyBlocks(data.studyBlocks);
        if (data.tasks) setTasks(data.tasks);
        if (data.activities) setActivities(data.activities);
        if (data.dailyLogs) setDailyLogs(data.dailyLogs);
        if (data.settings) {
          updateSettings(data.settings);
          if (data.settings.theme) {
            setTheme(data.settings.theme);
          }
        }

        window.dispatchEvent(
          new CustomEvent('add-toast', { detail: { message: 'Data imported successfully! Reloading...', type: 'success' } }),
        );
        
        // Reload page to ensure a perfectly clean state hydration across all components
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch {
        window.dispatchEvent(
          new CustomEvent('add-toast', { detail: { message: 'Invalid backup file', type: 'error' } }),
        );
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Reset ----
  const handleReset = async () => {
    const confirmed = window.confirm(
      'This will permanently delete ALL your data including subjects, tasks, planner entries, and activity logs. This cannot be undone.\n\nAre you sure?',
    );
    if (!confirmed) return;

    setSubjects([]);
    setStudyBlocks([]);
    setTasks([]);
    setActivities([]);
    setDailyLogs([]);
    await resetSettings();
    await fetch('/api/reset', { method: 'POST' });
    setTheme(defaultSettings.theme);

    window.dispatchEvent(
      new CustomEvent('add-toast', { detail: { message: 'All data has been reset', type: 'info' } }),
    );
  };

  // Loading skeleton
  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-[hsl(var(--muted))]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-[hsl(var(--muted))]" />
        ))}
      </div>
    );
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <>
      <PageHeader title="Settings" description="Personalize Athena to fit your study style perfectly ⚙️" />

      <div className="space-y-6 max-w-2xl">
        {/* ---- Appearance ---- */}
        <SettingsSection title="Appearance" description="Customize how the app looks" delay={0.05}>
          <div className="flex flex-wrap gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  updateSettings({ theme: value });
                  setTheme(value);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all',
                  theme === value
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] text-[hsl(var(--muted-foreground))]',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* ---- Font Size ---- */}
        <SettingsSection title="Font Size" description="Adjust text size across the app" delay={0.07}>
          <div className="flex flex-wrap gap-3">
            {([
              { value: 'small' as const, label: 'Small', preview: 'Aa' },
              { value: 'medium' as const, label: 'Medium', preview: 'Aa' },
              { value: 'large' as const, label: 'Large', preview: 'Aa' },
              { value: 'extra-large' as const, label: 'Extra Large', preview: 'Aa' },
            ]).map(({ value, label, preview }) => (
              <button
                key={value}
                onClick={() => updateSettings({ fontSize: value })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all min-w-[90px]',
                  settings.fontSize === value
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] text-[hsl(var(--muted-foreground))]',
                )}
              >
                <span style={{ fontSize: value === 'small' ? 14 : value === 'medium' ? 16 : value === 'large' ? 20 : 24 }} className="font-bold leading-none">{preview}</span>
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* ---- Study Goals ---- */}
        <SettingsSection title="Study Goals" description="Set your daily study targets" delay={0.1}>
          <div className="flex items-center gap-4">
            <Target className="h-5 w-5 text-[hsl(var(--muted-foreground))] shrink-0" />
            <div className="flex-1">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Daily study goal (hours)
              </label>
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={settings.dailyStudyGoalHours}
                onChange={(e) => updateSettings({ dailyStudyGoalHours: Number(e.target.value) })}
                className="mt-1.5 w-full max-w-[140px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </SettingsSection>

        {/* ---- Pomodoro ---- */}
        <SettingsSection title="Pomodoro Timer" description="Configure your focus and break durations" delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-[hsl(var(--muted-foreground))] shrink-0" />
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Focus duration (min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={settings.pomodoroMinutes}
                  onChange={(e) => updateSettings({ pomodoroMinutes: Number(e.target.value) })}
                  className="mt-1.5 w-full max-w-[140px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-[hsl(var(--muted-foreground))] shrink-0" />
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Break duration (min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.breakMinutes}
                  onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) })}
                  className="mt-1.5 w-full max-w-[140px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* ---- Data Management ---- */}
        <SettingsSection title="Data Management" description="Export, import, or reset your study data" delay={0.2}>
          <div className="space-y-3">
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))]"
            >
              <Download className="h-4 w-4 text-indigo-500" />
              <div className="text-left">
                <p>Export Data</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-normal">Download all your data as a JSON file</p>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))]"
            >
              <Upload className="h-4 w-4 text-emerald-500" />
              <div className="text-left">
                <p>Import Data</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-normal">Restore data from a backup file</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              <div className="text-left">
                <p>Reset All Data</p>
                <p className="text-xs text-red-400 font-normal">Permanently delete all data and reset settings</p>
              </div>
            </button>
          </div>
        </SettingsSection>

        {/* ---- About ---- */}
        <SettingsSection title="About" delay={0.25}>
          <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-mono text-xs">Athena v0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Built with</span>
              <span className="font-mono text-xs">Next.js · React · Tailwind CSS</span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className="font-mono text-xs">Database sync (server-backed)</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </>
  );
}
