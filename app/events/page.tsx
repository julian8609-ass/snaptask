import Link from 'next/link';

export default function EventsPage() {
  return (
    <main className="studio-shell">
      <section className="surface-card reveal p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">Events workspace</p>
        <h1 className="mt-3 text-3xl font-semibold">Calendar-ready event planning</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          This area is ready for upcoming event scheduling features. Keep all major milestones tied to your task system.
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
    </main>
  );
}