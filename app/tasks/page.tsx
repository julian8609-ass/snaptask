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
      <section className="surface-card p-6 sm:p-8">
        <header className="dashboard-header">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">Task center</p>
            <h1 className="mt-3 text-3xl font-semibold">Manage your execution pipeline</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Capture, prioritize, and complete work with clarity.</p>
          </div>
          <Link href="/" className="pill-link">Back to Dashboard</Link>
        </header>

        <div className="metric-grid mt-6">
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

      <section className="content-grid mt-4">
        <article className="surface-card p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Add a task</h2>
          <div className="mt-4">
            <TaskForm />
          </div>
        </article>

        <article className="surface-card p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Task list</h2>
          <div className="mt-4">
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
