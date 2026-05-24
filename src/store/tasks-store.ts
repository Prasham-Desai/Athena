import { create } from 'zustand';
import type { Task, TaskCategory, Priority } from '@/types';
import { generateId } from '@/lib/utils';

interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'completed'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  fetchTasks: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],

  fetchTasks: async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const { data } = await response.json();
        set({ tasks: data || [] });
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  },

  addTask: async (task) => {
    const newTask = {
      ...task,
      id: generateId(),
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    // Optimistic update
    set((state) => ({ tasks: [...state.tasks, newTask] }));

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
    } catch (error) {
      console.error('Failed to save task to backend', error);
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update task', error);
    }
  },

  deleteTask: async (id) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  },

  toggleTask: async (id) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isCompleted = !task.completed;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: isCompleted, completedAt } : t
      ),
    }));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: isCompleted, completedAt }),
      });
    } catch (error) {
      console.error('Failed to toggle task', error);
    }
  },

  setTasks: (tasks) => set({ tasks }),
}));
