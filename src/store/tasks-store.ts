import { create } from 'zustand';
import type { Task, TaskCategory, Priority } from '@/types';
import { generateId } from '@/lib/utils';

interface TasksState {
  tasks: Task[];
  cacheByYear: Record<string, Task[]>;
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'completed'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  fetchTasks: (academicYearId?: string, force?: boolean) => Promise<void>;
}

let tasksFetchId = 0;
const inFlightTasksMap = new Map<string, Promise<any>>();

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  cacheByYear: {},
  isLoading: false,

  fetchTasks: async (academicYearId?: string, force?: boolean) => {
    const activeYearStore = (await import('./academic-year-store')).useAcademicYearStore;
    const yearId = academicYearId || (typeof window !== 'undefined' ? activeYearStore.getState().activeYearId : 'year_3');

    const cached = get().cacheByYear[yearId];
    const isCurrentActive = typeof window !== 'undefined'
      ? activeYearStore.getState().activeYearId === yearId
      : true;

    if (cached && !force) {
      if (isCurrentActive) {
        set({ tasks: cached, isLoading: false });
      }
      return;
    }

    if (inFlightTasksMap.has(yearId)) {
      return inFlightTasksMap.get(yearId);
    }

    const requestId = ++tasksFetchId;
    if (isCurrentActive && !cached) {
      set({ isLoading: true });
    }

    const promise = (async () => {
      try {
        const url = yearId ? `/api/tasks?academic_year_id=${yearId}` : '/api/tasks';
        const response = await fetch(url);
        if (response.ok) {
          const { data } = (await response.json()) as any;
          const loaded = data || [];
          set((state) => {
            const currentYear = activeYearStore.getState().activeYearId;
            return {
              cacheByYear: { ...state.cacheByYear, [yearId]: loaded },
              tasks: (currentYear === yearId || !currentYear) ? loaded : state.tasks,
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      } finally {
        if (requestId === tasksFetchId) set({ isLoading: false });
        inFlightTasksMap.delete(yearId);
      }
    })();

    inFlightTasksMap.set(yearId, promise);
    return promise;
  },

  addTask: async (task) => {
    const yearId = (await import('./academic-year-store')).useAcademicYearStore.getState().activeYearId || 'year_3';
    const newTask = {
      ...task,
      id: generateId(),
      academicYearId: yearId,
      academic_year_id: yearId,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      actualMinutes: null,
    };

    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({ tasks: [...state.tasks, newTask] }));

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('Failed to save task to backend', error);
      set({ tasks: previousTasks });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to add task', type: 'error' } }));
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update');
    } catch (error) {
      console.error('Failed to update task', error);
      set({ tasks: previousTasks });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to update task', type: 'error' } }));
      throw error;
    }
  },

  deleteTask: async (id) => {
    const previousTasks = get().tasks;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
    } catch (error) {
      console.error('Failed to delete task', error);
      set({ tasks: previousTasks });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to delete task', type: 'error' } }));
      throw error;
    }
  },

  toggleTask: async (id) => {
    const { tasks, updateTask } = get();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isCompleted = !task.completed;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    try {
      await updateTask(id, { completed: isCompleted, completedAt });
    } catch (e) {
      // rollback is handled by updateTask
    }
  },

  setTasks: (tasks) => {
    const yearId = tasks[0]?.academic_year_id || tasks[0]?.academicYearId;
    set((state) => ({
      tasks,
      cacheByYear: yearId ? { ...state.cacheByYear, [yearId]: tasks } : state.cacheByYear,
    }));
  },
}));
