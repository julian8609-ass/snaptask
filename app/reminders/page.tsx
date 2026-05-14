'use client';

import Link from 'next/link';
import { useTaskContext } from '@/context/TaskContext';

export default function RemindersPage() {
  const { reminders } = useTaskContext();

  return (
    <main className="studio-shell">
      <section className="surface-card p-4 sm:p-5">
        <header className="dashboard-header flex-col items-start sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">Reminder center</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">Stay ahead of deadlines</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">A compact view for task nudges, follow-ups, and scheduled prompts.</p>
          </div>
          <Link href="/" className="pill-link">Back to Dashboard</Link>
        </header>

        <div className="metric-grid mt-4">
          <article className="metric-tile">
            <p className="metric-label">Active</p>
            <p className="metric-value">{reminders.length}</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Channel</p>
            <p className="metric-value">In-app</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Status</p>
            <p className="metric-value">Ready</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Focus</p>
            <p className="metric-value">Today</p>
          </article>
        </div>
      </section>

      <section className="surface-card mt-3 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Queue</p>
            <h2 className="mt-1 text-lg font-semibold">Upcoming reminders</h2>
          </div>
          <Link href="/tasks" className="pill-link">Open Tasks</Link>
        </div>

        {reminders.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.045] p-5 text-slate-300">
            <p className="font-semibold text-white">No reminders yet.</p>
            <p className="mt-1 text-sm">Create reminders from tasks as scheduling features come online.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {reminders.map((reminder) => (
              <article key={reminder.id} className="rounded-[20px] border border-white/10 bg-white/[0.045] p-4">
                <p className="font-semibold text-white">{reminder.title}</p>
                <p className="mt-1 text-sm text-slate-400">{reminder.reminder_time}</p>
                <span className="mt-3 inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-200">
                  {reminder.reminder_type}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}