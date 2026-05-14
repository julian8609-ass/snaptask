'use client';

import { useTaskContext } from '@/context/TaskContext';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/TaskList';
import Link from 'next/link';

export default function TodoPage() {
  const { tasks, loading, error, stats } = useTaskContext();
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <main className="studio-shell">
      <section className="surface-card p-4 sm:p-5">
        <header className="dashboard-header flex-col items-start sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--brand)]">Task center</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">Manage your execution pipeline</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Capture, prioritize, and complete work with a compact command view.</p>
          </div>
          <Link href="/" className="pill-link">Back to Dashboard</Link>
        </header>

        <div className="metric-grid mt-4">
          <article className="metric-tile">
            <p className="metric-label">Total</p>
            <p className="metric-value">{stats.total}</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Completed</p>
            <p className="metric-value">{stats.completed}</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Pending</p>
            <p className="metric-value">{stats.pending}</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Completion Rate</p>
            <p className="metric-value">{completionRate}%</p>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <article className="surface-card p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Capture</p>
          <h2 className="mt-1 text-lg font-semibold">Add a task</h2>
          <div className="mt-3">
            <TaskForm />
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Board</p>
              <h2 className="mt-1 text-lg font-semibold">Task list</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{tasks.length} visible items</p>
          </div>
          <div className="mt-3">
            {loading ? (
              <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-[var(--text-secondary)]">Loading your tasks...</p>
            ) : (
              <TaskList tasks={tasks} />
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          )}
        </article>
      </section>
    </main>
  );
}
