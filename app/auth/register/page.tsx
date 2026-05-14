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
    <main className="studio-shell flex min-h-screen items-center">
      <div className="surface-card mx-auto w-full max-w-lg p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">Get started</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-slate-300">Register with email and password to start using the AI task planner.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="app-label">
            Name (optional)
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="app-input"
            />
          </label>

          <label className="app-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="app-input"
            />
          </label>

          <label className="app-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="app-input"
            />
          </label>

          {error ? <p className="rounded-3xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {success ? <p className="rounded-3xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="app-primary-button w-full"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-orange-200 hover:text-orange-100">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
