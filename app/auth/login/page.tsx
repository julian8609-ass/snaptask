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
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-semibold text-white">Sign in to your account</h1>
        <p className="mt-3 text-sm text-slate-300">Use your email and password to sign in and access your AI task dashboard.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
            />
          </label>

          {error ? <p className="rounded-3xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Need an account?{' '}
          <Link href="/auth/register" className="font-semibold text-white hover:text-emerald-300">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
