import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api/client';

type RecordType = 'INCOME' | 'EXPENSE';

type RecordsListResponse = {
  items: Array<{
    id: string;
    amount: string | number;
    type: RecordType;
    category: string;
    date: string;
    notes: string | null;
  }>;
  page: number;
  limit: number;
  total: number;
};

type RecordResponse = {
  record: {
    id: string;
    amount: string | number;
    type: RecordType;
    category: string;
    date: string;
    notes: string | null;
  };
};

type CreateRecordInput = {
  amount: number;
  type: RecordType;
  category: string;
  date: string;
  notes?: string;
};

type UpdateRecordInput = Partial<CreateRecordInput>;

export function RecordsPage(props: { role: 'VIEWER' | 'ANALYST' | 'ADMIN' }) {
  const canManage = props.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const [data, setData] = useState<RecordsListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createAmount, setCreateAmount] = useState('');
  const [createType, setCreateType] = useState<RecordType>('EXPENSE');
  const [createCategory, setCreateCategory] = useState('');
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createNotes, setCreateNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<RecordType>('EXPENSE');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<RecordsListResponse>(`/api/records?page=${page}&limit=10`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const startEdit = (r: RecordsListResponse['items'][number]) => {
    setEditingId(r.id);
    setEditAmount(String(r.amount));
    setEditType(r.type);
    setEditCategory(r.category);
    setEditDate(new Date(r.date).toISOString().slice(0, 10));
    setEditNotes(r.notes ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditCategory('');
    setEditDate('');
    setEditNotes('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setCreating(true);
    setError(null);

    try {
      const payload: CreateRecordInput = {
        amount: Number(createAmount),
        type: createType,
        category: createCategory,
        date: new Date(createDate).toISOString(),
        ...(createNotes.trim() ? { notes: createNotes.trim() } : {}),
      };

      await apiFetch<RecordResponse>('/api/records', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreateAmount('');
      setCreateType('EXPENSE');
      setCreateCategory('');
      setCreateDate(new Date().toISOString().slice(0, 10));
      setCreateNotes('');

      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  const submitUpdate = async () => {
    if (!canManage || !editingId) return;

    setSaving(true);
    setError(null);

    try {
      const payload: UpdateRecordInput = {
        amount: editAmount === '' ? undefined : Number(editAmount),
        type: editType,
        category: editCategory,
        date: editDate ? new Date(editDate).toISOString() : undefined,
        notes: editNotes,
      };

      await apiFetch<RecordResponse>(`/api/records/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!canManage) return;

    setError(null);

    try {
      await apiFetch<{ ok: boolean }>(`/api/records/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Records</h1>
          <div className="mt-1 text-sm text-slate-600">Analyst can view. Admin can manage.</div>
        </div>

        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Reload'}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      {canManage ? (
        <section className="card p-5 sm:p-6">
          <div className="text-sm font-semibold text-slate-900">Create record</div>
          <form onSubmit={submitCreate} className="mt-4 grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <input className="input mt-1" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select className="input mt-1" value={createType} onChange={(e) => setCreateType(e.target.value as RecordType)}>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <input className="input mt-1" value={createCategory} onChange={(e) => setCreateCategory(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input className="input mt-1" type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} />
            </div>
            <div className="sm:col-span-12">
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <input className="input mt-1" value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-12 flex items-center justify-end">
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card p-5 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div className="col-span-6">Type / Category</div>
            <div className="col-span-3 text-right">Amount</div>
            <div className="col-span-3 text-right">Date</div>
          </div>

          <div className="divide-y divide-slate-200">
            {!data || data.items.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-600">No records</div>
            ) : (
              data.items.map((r) => (
                <div key={r.id} className="px-3 py-3">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-6 min-w-0">
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
                    <div className="col-span-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                      {fmt(Number(r.amount))}
                    </div>
                    <div className="col-span-3 text-right text-sm text-slate-600">{new Date(r.date).toLocaleDateString()}</div>
                  </div>

                  {canManage ? (
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                      {editingId === r.id ? (
                        <>
                          <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                            Cancel
                          </button>
                          <button className="btn btn-primary" onClick={submitUpdate} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost" onClick={() => startEdit(r)}>
                            Edit
                          </button>
                          <button className="btn btn-ghost" onClick={() => void remove(r.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}

                  {canManage && editingId === r.id ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-slate-700">Amount</label>
                        <input className="input mt-1" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <select className="input mt-1" value={editType} onChange={(e) => setEditType(e.target.value as RecordType)}>
                          <option value="INCOME">Income</option>
                          <option value="EXPENSE">Expense</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <input className="input mt-1" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-slate-700">Date</label>
                        <input className="input mt-1" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                      </div>
                      <div className="sm:col-span-12">
                        <label className="text-sm font-medium text-slate-700">Notes</label>
                        <input className="input mt-1" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {data ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Page <span className="font-medium text-slate-900">{data.page}</span> of{' '}
              <span className="font-medium text-slate-900">{totalPages}</span>
              <span className="text-slate-400"> · </span>
              <span className="font-medium text-slate-900">{data.total}</span> total
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Prev
              </button>
              <button className="btn btn-primary" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}
