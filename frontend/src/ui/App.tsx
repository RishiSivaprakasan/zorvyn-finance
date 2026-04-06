import React from 'react';
import { DashboardPage } from './DashboardPage';
import { LoginPage } from './LoginPage';
import { RecordsPage } from './RecordsPage';
import { UsersPage } from './UsersPage';
import { apiFetch } from './api/client';
import { useAuth } from './auth/useAuth';

type MeUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
};

export function App() {
  const { token, logout } = useAuth();

  const [me, setMe] = React.useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(false);
  const [meError, setMeError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'dashboard' | 'records' | 'users'>('dashboard');

  React.useEffect(() => {
    if (!token) {
      setMe(null);
      setMeError(null);
      setTab('dashboard');
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoadingMe(true);
      setMeError(null);
      try {
        const res = await apiFetch<{ user: MeUser }>('/api/auth/me');
        if (cancelled) return;
        setMe(res.user);
      } catch (err) {
        if (cancelled) return;
        setMe(null);
        setMeError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        if (cancelled) return;
        setLoadingMe(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const canSeeRecords = me?.role === 'ANALYST' || me?.role === 'ADMIN';
  const canSeeUsers = me?.role === 'ADMIN';

  React.useEffect(() => {
    if (tab === 'users' && !canSeeUsers) setTab('dashboard');
    if (tab === 'records' && !canSeeRecords) setTab('dashboard');
  }, [tab, canSeeUsers, canSeeRecords]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <div className="text-sm font-semibold tracking-wide text-slate-900">Zorvyn</div>
            <div className="hidden text-sm text-slate-500 sm:block">Finance</div>
          </div>

          <div className="flex items-center gap-2">
            {token && me ? (
              <span className="hidden rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 sm:inline-flex">
                {me.role}
              </span>
            ) : null}
            {token ? (
              <button className="btn btn-ghost" onClick={logout}>
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {token ? (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <button
                className={tab === 'dashboard' ? 'btn btn-primary' : 'btn btn-ghost'}
                onClick={() => setTab('dashboard')}
              >
                Dashboard
              </button>
              {canSeeRecords ? (
                <button
                  className={tab === 'records' ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => setTab('records')}
                >
                  Records
                </button>
              ) : null}
              {canSeeUsers ? (
                <button
                  className={tab === 'users' ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => setTab('users')}
                >
                  Users
                </button>
              ) : null}
            </div>

            {meError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{meError}</div>
            ) : null}

            {loadingMe ? (
              <div className="text-sm text-slate-600">Loading…</div>
            ) : me ? (
              tab === 'dashboard' ? (
                <DashboardPage me={me} />
              ) : tab === 'records' ? (
                <RecordsPage role={me.role} />
              ) : (
                <UsersPage />
              )
            ) : null}
          </>
        ) : (
          <LoginPage />
        )}
      </main>
    </div>
  );
}
