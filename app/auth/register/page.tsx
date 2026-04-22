'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Unable to register.');
      return;
    }

    setSuccess('Account created! Please sign in.');
    setName('');
    setEmail('');
    setPassword('');
    router.push('/auth/login');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-semibold text-white">Create your account</h1>
        <p className="mt-3 text-sm text-slate-300">Register with email and password to start using the AI task planner.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">
            Name (optional)
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
            />
          </label>

          {error ? <p className="rounded-3xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {success ? <p className="rounded-3xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-white hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
