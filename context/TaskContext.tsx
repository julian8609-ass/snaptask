'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Task, TaskStats, Reminder } from '@/types';
import { getDemoUserId } from '@/lib/user-utils';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  stats: TaskStats;
  reminders: Reminder[];
  refreshTasks: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  deleteTaskById: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Calculate stats
  const stats: TaskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    pending: tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length,
    overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
    by_category: tasks.reduce(
      (acc, t) => {
        const cat = t.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    by_priority: tasks.reduce(
      (acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    pendingTasks: tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length,
    energy: tasks.reduce((acc, t) => acc + (t.energy || 0), 0),
    maxEnergy: 100, // Example static value
    xp: tasks.reduce((total, task) => total + (task.xp || 0), 0),
  };

  // Get user ID from localStorage or generate demo UUID
  useEffect(() => {
    const id = getDemoUserId();
    setUserId(id);
  }, []);

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch tasks: ${response.status} ${errorText}`);
        throw new Error('Failed to fetch tasks');
      }
      const data: Task[] = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Tasks fetch error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh reminders
  const refreshReminders = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/reminders?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch reminders: ${response.status} ${errorText}`);
        throw new Error(`Failed to fetch reminders: ${response.status}`);
      }
      const data: Reminder[] = await response.json();
      setReminders(data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  }, [userId]);

  // Add task
  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!userId) return null;
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: task.title,
            description: task.description,
            priority: task.priority || 'medium',
            dueDate: task.due_date,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('API Error:', error);
          throw new Error('Failed to create task');
        }
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create task');
        return null;
      }
    },
    [userId]
  );

  // Update task status
  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update task');
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [refreshTasks, userId]);

  // Delete task
  const deleteTaskById = useCallback(async (taskId: string) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }, [userId]);

  // Complete task
  const completeTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, 'completed');
    },
    [updateTaskStatus]
  );

  // Initial load
  useEffect(() => {
    if (userId) {
      refreshTasks();
      refreshReminders();

      // Refresh tasks every 30 seconds
      const interval = setInterval(() => {
        refreshTasks();
        refreshReminders();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, refreshTasks, refreshReminders]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        stats,
        reminders,
        refreshTasks,
        refreshReminders,
        addTask,
        updateTaskStatus,
        deleteTaskById,
        completeTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
