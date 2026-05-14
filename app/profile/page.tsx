'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { getDemoUserId } from '@/lib/user-utils';

type LeaderboardEntry = {
  id: string;
  name: string | null;
  xp: number;
  streak: number;
  rank: string;
};

type ProfileResponse = {
  profile?: {
    name: string | null;
    email: string;
    xp: number;
    rank: string;
    streak: number;
    mood: string;
    personality: string;
    energy: number;
    completedTasks: number;
    pendingTasks: number;
    aiTasks: number;
    userTasks: number;
  };
  leaderboard?: LeaderboardEntry[];
  error?: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;

    setLoading(true);
    const userId = getDemoUserId();
    fetch(`/api/profile?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        if (json.error) setError(json.error);
      })
      .catch(() => setError('Unable to load profile.'))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading') {
    return (
      <main className="studio-shell">
        <div className="surface-card mx-auto max-w-3xl p-6 text-center text-lg">Loading profile...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="studio-shell">
        <div className="surface-card mx-auto max-w-3xl p-6 text-center sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">Profile</p>
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-4 text-slate-300">You need to sign in to view your profile.</p>
          <button
            type="button"
            onClick={() => signIn()}
            className="app-primary-button mt-8 px-6"
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="studio-shell">
      <div className="space-y-4">
        <header className="surface-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">Your profile</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">Welcome back, {session.user?.name ?? session.user?.email}</h1>
              <p className="mt-1 text-sm text-slate-300">Review progress, rank, energy, and execution patterns.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => signOut()}
                className="pill-link"
              >
                Sign out
              </button>
              <Link
                href="/"
                className="app-primary-button flex items-center px-5"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="surface-card p-6 text-center text-slate-300">Loading account data...</div>
        ) : error || !data ? (
          <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-100">
            <p>{error || 'Unexpected error loading profile.'}</p>
            <p className="mt-3 text-sm text-slate-300">Try refreshing the page or signing out and back in.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <section className="surface-card space-y-4 p-4 sm:p-5">
              <div className="metric-grid">
                <div className="metric-tile">
                  <p className="metric-label">Rank</p>
                  <p className="metric-value">{data.profile?.rank}</p>
                  <p className="mt-2 text-slate-400">{data.profile?.xp ?? 0} XP</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">Streak</p>
                  <p className="metric-value">{data.profile?.streak}</p>
                  <p className="mt-2 text-slate-400">Daily momentum count</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">Completed</p>
                  <p className="metric-value">{data.profile?.completedTasks}</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">Pending</p>
                  <p className="metric-value">{data.profile?.pendingTasks}</p>
                </div>
                <div className="metric-tile">
                  <p className="metric-label">Energy</p>
                  <p className="metric-value">{data.profile?.energy}</p>
                </div>
                <div className="metric-tile sm:col-span-2">
                  <p className="metric-label">Mood</p>
                  <p className="metric-value">{data.profile?.mood}</p>
                </div>
                <div className="metric-tile sm:col-span-2">
                  <p className="metric-label">Personality</p>
                  <p className="metric-value">{data.profile?.personality}</p>
                </div>
              </div>
            </section>

            <aside className="surface-card p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Community</p>
                <h2 className="mt-1 text-lg font-semibold">Leaderboard</h2>
                <div className="mt-4 space-y-2">
                  {data.leaderboard?.map((entry, index) => (
                    <div key={entry.id} className="rounded-[18px] border border-white/10 bg-white/[0.045] p-3">
                      <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                        <div>
                          <p className="font-semibold text-white">{index + 1}. {entry.name ?? 'Guest'}</p>
                          <p>{entry.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{entry.xp} XP</p>
                          <p className="text-slate-400">{entry.streak} streak</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
