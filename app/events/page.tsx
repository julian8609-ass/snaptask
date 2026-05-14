import Link from 'next/link';

export default function EventsPage() {
  return (
    <main className="studio-shell">
      <section className="surface-card reveal p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--brand)]">Events workspace</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">Calendar-ready event planning</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          This area is ready for upcoming event scheduling features. Keep all major milestones tied to your task system.
        </p>

        <div className="metric-grid mt-4">
          <article className="metric-tile">
            <p className="metric-label">Mode</p>
            <p className="metric-value">Planning</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Calendar</p>
            <p className="metric-value">Ready</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Links</p>
            <p className="metric-value">Tasks</p>
          </article>
          <article className="metric-tile">
            <p className="metric-label">Focus</p>
            <p className="metric-value">Milestones</p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className="app-primary-button flex items-center px-5">
            Back to Dashboard
          </Link>
          <Link href="/tasks" className="pill-link">
            Open Tasks
          </Link>
        </div>
      </section>

      <section className="content-grid">
        <article className="surface-card p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Upcoming</p>
          <h2 className="mt-1 text-lg font-semibold">Event pipeline</h2>
          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.045] p-5 text-sm text-slate-300">
            Convert important dates into focused tasks, reminders, and prep checklists.
          </div>
        </article>
        <article className="surface-card p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Workflow</p>
          <h2 className="mt-1 text-lg font-semibold">Suggested setup</h2>
          <div className="mt-4 grid gap-2">
            {['Create event', 'Break into tasks', 'Schedule reminders'].map((item, index) => (
              <div key={item} className="rounded-[18px] border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-200">
                {index + 1}. {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}