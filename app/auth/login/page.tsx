'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      // Provide user-friendly error messages
      const errorMap: Record<string, string> = {
        CredentialsSignin: 'Invalid email or password. Please check and try again.',
      };
      setError(errorMap[result.error] || result.error || 'Unable to sign in. Please try again.');
      return;
    }

    if (result?.ok) {
      router.push('/');
    } else {
      setError('Unable to sign in. Please try again.');
    }
  };

  return (
    <main className="studio-shell flex min-h-screen items-center">
      <div className="surface-card mx-auto w-full max-w-lg p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">Welcome back</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Sign in to SnapTask</h1>
        <p className="mt-2 text-sm text-slate-300">Use your email and password to access your AI task dashboard.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
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
              className="app-input"
            />
          </label>

          {error ? <p className="rounded-3xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="app-primary-button w-full"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Need an account?{' '}
          <Link href="/auth/register" className="font-semibold text-orange-200 hover:text-orange-100">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
