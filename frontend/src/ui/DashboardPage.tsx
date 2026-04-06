import React, { useEffect, useState } from 'react';
import { apiFetch } from './api/client';

type Summary = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
};

type CategoryTotalsResponse = {
  items: Array<{ category: string; total: number }>;
};

type RecentResponse = {
  items: Array<{
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: string;
    notes: string | null;
    createdAt: string;
  }>;
};

type TrendsResponse = {
  items: Array<{ month: string; income: number; expense: number; net: number }>;
};

type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'VIEWER' | 'ANALYST' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE';
  };
};

export function DashboardPage(props: { me: MeResponse['user'] }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentResponse['items']>([]);
  const [trendMonths, setTrendMonths] = useState(6);
  const [trends, setTrends] = useState<TrendsResponse['items']>([]);
  const [typeForCategories, setTypeForCategories] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotalsResponse['items']>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, recentRes, categoriesRes, trendsRes] = await Promise.all([
        apiFetch<Summary>('/api/dashboard/summary'),
        apiFetch<RecentResponse>('/api/dashboard/recent?limit=10'),
        apiFetch<CategoryTotalsResponse>(`/api/dashboard/category-totals?type=${typeForCategories}`),
        apiFetch<TrendsResponse>(`/api/dashboard/trends/monthly?months=${trendMonths}`),
      ]);

      setSummary(summaryRes);
      setRecent(recentRes.items);
      setCategoryTotals(categoriesRes.items);
      setTrends(trendsRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeForCategories, trendMonths]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{props.me.email}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
              {props.me.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="card p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Overview</div>
              <div className="mt-1 text-sm text-slate-600">Income vs expenses, all time.</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi label="Total income" value={summary ? fmt(summary.totalIncome) : '…'} tone="good" />
            <Kpi label="Total expenses" value={summary ? fmt(summary.totalExpenses) : '…'} tone="bad" />
            <Kpi label="Net" value={summary ? fmt(summary.netBalance) : '…'} tone="neutral" />
          </div>
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Category totals</div>
              <div className="mt-1 text-sm text-slate-600">Top categories for the selected type.</div>
            </div>
            <select
              value={typeForCategories}
              onChange={(e) => setTypeForCategories(e.target.value as any)}
              className="input w-auto"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div className="mt-5 space-y-2">
            {categoryTotals.length === 0 ? (
              <div className="text-sm text-slate-600">No data</div>
            ) : (
              categoryTotals.slice(0, 8).map((it) => (
                <div
                  key={it.category}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="truncate text-sm font-medium text-slate-800">{it.category}</div>
                  <div className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{fmt(it.total)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Monthly trends</div>
              <div className="mt-1 text-sm text-slate-600">Income, expense and net by month.</div>
            </div>
            <select
              value={trendMonths}
              onChange={(e) => setTrendMonths(Number(e.target.value))}
              className="input w-auto"
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <div className="col-span-4">Month</div>
              <div className="col-span-8 text-right">Income / Expense / Net</div>
            </div>
            <div className="divide-y divide-slate-200">
              {trends.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-600">No data</div>
              ) : (
                trends.map((t) => (
                  <div key={t.month} className="grid grid-cols-12 items-center px-3 py-2.5">
                    <div className="col-span-4 text-sm font-medium text-slate-800">{t.month}</div>
                    <div className="col-span-8 text-right text-sm tabular-nums">
                      <span className="font-semibold text-emerald-700">{fmt(t.income)}</span>
                      <span className="mx-2 text-slate-300">/</span>
                      <span className="font-semibold text-rose-700">{fmt(t.expense)}</span>
                      <span className="mx-2 text-slate-300">/</span>
                      <span className="font-semibold text-slate-900">{fmt(t.net)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6 lg:col-span-5">
          <div>
            <div className="text-sm font-semibold text-slate-900">Recent activity</div>
            <div className="mt-1 text-sm text-slate-600">Latest records by date.</div>
          </div>

          <div className="mt-5 space-y-2">
            {recent.length === 0 ? (
              <div className="text-sm text-slate-600">No records yet</div>
            ) : (
              recent.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            r.type === 'INCOME'
                              ? 'rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
                              : 'rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700'
                          }
                        >
                          {r.type}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-900">{r.category}</span>
                      </div>
                      {r.notes ? <div className="mt-1 truncate text-xs text-slate-500">{r.notes}</div> : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-slate-900">{fmt(r.amount)}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi(props: { label: string; value: string; tone: 'good' | 'bad' | 'neutral' }) {
  const toneClass =
    props.tone === 'good'
      ? 'bg-emerald-50 border-emerald-100'
      : props.tone === 'bad'
        ? 'bg-rose-50 border-rose-100'
        : 'bg-slate-50 border-slate-200';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{props.value}</div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}
