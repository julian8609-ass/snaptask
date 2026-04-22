'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';

export default function DailyReflection() {
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="studio-shell">
      <section className="surface-card reveal p-6 sm:p-8">
        <header className="dashboard-header">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">Daily reflection</p>
            <h1 className="mt-2 text-3xl font-semibold">Close your day with clarity</h1>
          </div>
          <Link href="/" className="pill-link">Dashboard</Link>
        </header>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label htmlFor="daily-reflection" className="block text-sm font-semibold text-[var(--text-secondary)]">
              What worked well today, and what should change tomorrow?
            </label>
            <textarea
              id="daily-reflection"
              rows={7}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)]"
              placeholder="Write your reflection here..."
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--brand)] px-6 py-2.5 font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              Save Reflection
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <p className="text-lg font-semibold">Reflection saved.</p>
            <p className="mt-1 text-sm">Small daily reviews create compounding improvements in focus and execution.</p>
          </div>
        )}
      </section>
    </main>
  );
}