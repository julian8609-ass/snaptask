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
      <section className="surface-card reveal p-4 sm:p-5">
        <header className="dashboard-header flex-col items-start sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--brand)]">Daily reflection</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">Close your day with clarity</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Capture wins, friction, and tomorrow's next best step.</p>
          </div>
          <Link href="/" className="pill-link">Dashboard</Link>
        </header>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
            <label htmlFor="daily-reflection" className="app-label">
              What worked well today, and what should change tomorrow?
              <textarea
                id="daily-reflection"
                rows={7}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="app-textarea min-h-[180px] placeholder:text-slate-500"
                placeholder="Wins, blockers, lessons, and tomorrow's top priority..."
              />
            </label>
            <button
              type="submit"
              className="app-primary-button px-6"
            >
              Save Reflection
            </button>
          </form>
        ) : (
          <div className="mt-4 rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-100">
            <p className="text-lg font-semibold">Reflection saved.</p>
            <p className="mt-1 text-sm text-emerald-200/80">Small daily reviews create compounding improvements in focus and execution.</p>
          </div>
        )}
      </section>
    </main>
  );
}