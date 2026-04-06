import React, { useState } from 'react';
import { apiFetch } from './api/client';
import { useAuth } from './auth/useAuth';

type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'VIEWER' | 'ANALYST' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE';
  };
};

export function LoginPage() {
  const { setToken } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, ...(name ? { name } : {}) };

      const data = await apiFetch<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-rose-200/45 blur-3xl" />
      </div>

      <div className="relative grid min-h-[calc(100dvh-160px)] items-center">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {mode === 'login' ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {mode === 'login' ? 'Sign in to view your finance dashboard.' : 'Register to start exploring the dashboard.'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {mode === 'login' ? 'Login' : 'Register'}
                </span>
              </div>

              <form onSubmit={submit} className="mt-6 grid gap-4">
                {mode === 'register' ? (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Name (optional)</label>
                    <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input
                    className="input mt-1"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {error}
                  </div>
                ) : null}

                <button className="btn btn-primary w-full" disabled={loading} type="submit">
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>

                <button
                  className="btn btn-ghost w-full"
                  type="button"
                  onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
                >
                  {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
              </form>

              <div className="mt-5 text-xs text-slate-500">
                Backend: {String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000')}
              </div>
            </section>

            <aside className="card p-6 sm:p-8">
              <h2 className="text-sm font-semibold text-slate-900">Quick notes</h2>
              <div className="mt-3 grid gap-3 text-sm text-slate-600">
                <div className="rounded-xl bg-slate-50 p-4">
                  First registered user becomes <span className="font-semibold text-slate-900">ADMIN</span>.
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  Roles:
                  <div className="mt-2 grid gap-1 text-slate-700">
                    <div>Viewer: dashboard only</div>
                    <div>Analyst: dashboard + records list</div>
                    <div>Admin: full access</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
