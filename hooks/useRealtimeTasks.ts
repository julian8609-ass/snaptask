'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types';

export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial tasks
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Connect to SSE stream for real-time updates
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('task-updated', (event) => {
      try {
        const task = JSON.parse(event.data);
        setTasks(prev => {
          const index = prev.findIndex(t => t.id === task.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = task;
            return updated;
          }
          return [...prev, task];
        });
      } catch (err) {
        console.error('Failed to parse task update:', err);
      }
    });

    eventSource.addEventListener('task-deleted', (event) => {
      try {
        const { id } = JSON.parse(event.data);
        setTasks(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error('Failed to parse task deletion:', err);
      }
    });

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return { tasks, loading, error };
}
