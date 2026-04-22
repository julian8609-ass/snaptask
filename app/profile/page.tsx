'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { XPProgressBar } from '@/components/XPProgressBar';

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
    fetch('/api/profile')
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
      <main className="min-h-screen bg-black px-6 py-16 text-slate-100">
        <div className="mx-auto max-w-3xl text-center text-lg">Loading profile…</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black px-6 py-16 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-orange-500/15 bg-[#101010]/90 p-10 text-center shadow-2xl shadow-black/20">
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-4 text-slate-300">You need to sign in to view your profile.</p>
          <button
            type="button"
            onClick={() => signIn()}
            className="mt-8 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-orange-500/15 bg-[#101010]/90 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-orange-300/90">Your profile</p>
              <h1 className="mt-3 text-4xl font-semibold">Welcome back, {session.user?.name ?? session.user?.email}</h1>
              <p className="mt-2 text-slate-300">Review your progress, rank, and AI task performance.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Sign out
              </button>
              <Link
                href="/"
                className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#101010]/90 p-8 text-center text-slate-300">Loading account data…</div>
        ) : error || !data ? (
          <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-100">
            <p>{error || 'Unexpected error loading profile.'}</p>
            <p className="mt-3 text-sm text-slate-300">Try refreshing the page or signing out and back in.</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="space-y-6 rounded-[2rem] border border-orange-500/15 bg-[#101010]/90 p-8 shadow-xl shadow-black/30">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-black/80 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Rank</p>
                  <p className="mt-4 text-3xl font-semibold text-white">{data.profile?.rank}</p>
                  <p className="mt-2 text-slate-400">{data.profile?.xp ?? 0} XP</p>
                </div>
                <div className="rounded-[1.75rem] bg-black/80 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Streak</p>
                  <p className="mt-4 text-3xl font-semibold text-white">{data.profile?.streak}</p>
                  <p className="mt-2 text-slate-400">Daily momentum count</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.75rem] bg-black/80 p-6 text-center">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Completed</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{data.profile?.completedTasks}</p>
                </div>
                <div className="rounded-[1.75rem] bg-black/80 p-6 text-center">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Pending</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{data.profile?.pendingTasks}</p>
                </div>
                <div className="rounded-[1.75rem] bg-black/80 p-6 text-center">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Energy</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{data.profile?.energy}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-black/80 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Mood</p>
                  <p className="mt-3 text-xl font-semibold text-white">{data.profile?.mood}</p>
                </div>
                <div className="rounded-[1.75rem] bg-black/80 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-orange-300">Personality</p>
                  <p className="mt-3 text-xl font-semibold text-white">{data.profile?.personality}</p>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-orange-500/15 bg-[#101010]/90 p-6 shadow-xl shadow-black/30">
                <h2 className="text-xl font-semibold">Leaderboard</h2>
                <div className="mt-5 space-y-3">
                  {data.leaderboard?.map((entry, index) => (
                    <div key={entry.id} className="rounded-3xl bg-black/70 p-4">
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
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
