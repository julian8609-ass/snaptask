"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TaskCalendar } from '@/components/TaskCalendar';

type APIEventTask = {
  id: string;
  title: string;
  description?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  energy?: number;
  status?: string;
  skipCount?: number;
  xp?: number;
  source?: string;
  createdAt?: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
};

export default function EventsPage() {
  const [tasks, setTasks] = useState<APIEventTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const data = await res.json();
        if (mounted) setTasks(data || []);
      } catch (err: any) {
        setError(err?.message || 'Error fetching tasks');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const scheduledTasks = tasks.filter((t) => t.scheduledDate || t.scheduledTime || (t as any).due_date);

  return (
    <main className="studio-shell">
      <section className="surface-card reveal p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">Events workspace</p>
        <h1 className="mt-3 text-3xl font-semibold">Calendar-ready event planning</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          This area shows tasks that are scheduled or have dates — your calendar events.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-[var(--brand)] px-5 py-2.5 font-semibold text-white transition hover:bg-[var(--brand-strong)]">
            Back to Dashboard
          </Link>
          <Link href="/tasks" className="pill-link">
            Open Tasks
          </Link>
        </div>
      </section>

      <section className="mt-6">
        {loading && <div className="text-slate-400">Loading events...</div>}
        {error && <div className="text-rose-400">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2">
              <TaskCalendar tasks={scheduledTasks as any} />
            </div>

            <aside className="bg-[#0f0f0f] border border-white/5 rounded p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Upcoming events</h3>
              {scheduledTasks.length === 0 && <div className="text-slate-400">No scheduled events found.</div>}
              <ul className="space-y-3">
                {scheduledTasks.slice(0, 10).map((t) => (
                  <li key={t.id} className="text-sm">
                    <div className="font-semibold text-slate-100 truncate">{t.title}</div>
                    <div className="text-xs text-slate-400">{t.scheduledDate ? new Date(t.scheduledDate).toLocaleString() : (t as any).due_date || 'No date'}</div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}