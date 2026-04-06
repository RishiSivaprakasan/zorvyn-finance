import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api/client';

type UserRole = 'VIEWER' | 'ANALYST' | 'ADMIN';
type UserStatus = 'ACTIVE' | 'INACTIVE';

type UsersListResponse = {
  items: Array<{
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  page: number;
  limit: number;
  total: number;
};

type UserResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
  };
};

type CreateUserInput = {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
};

type UpdateUserInput = {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
};

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('VIEWER');
  const [createStatus, setCreateStatus] = useState<UserStatus>('ACTIVE');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('VIEWER');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');
  const [saving, setSaving] = useState(false);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<UsersListResponse>(`/api/users?page=${page}&limit=10`);
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

  const startEdit = (u: UsersListResponse['items'][number]) => {
    setEditingId(u.id);
    setEditName(u.name ?? '');
    setEditRole(u.role);
    setEditStatus(u.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setCreating(true);
    setError(null);

    try {
      const payload: CreateUserInput = {
        email: createEmail,
        password: createPassword,
        ...(createName.trim() ? { name: createName.trim() } : {}),
        role: createRole,
        status: createStatus,
      };

      await apiFetch<UserResponse>('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreateEmail('');
      setCreatePassword('');
      setCreateName('');
      setCreateRole('VIEWER');
      setCreateStatus('ACTIVE');

      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  const submitUpdate = async () => {
    if (!editingId) return;

    setSaving(true);
    setError(null);

    try {
      const payload: UpdateUserInput = {
        name: editName.trim() ? editName.trim() : undefined,
        role: editRole,
        status: editStatus,
      };

      await apiFetch<UserResponse>(`/api/users/${editingId}`, {
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

  const deactivate = async (id: string) => {
    setError(null);

    try {
      await apiFetch<UserResponse>(`/api/users/${id}/deactivate`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Users</h1>
          <div className="mt-1 text-sm text-slate-600">Admin-only user management.</div>
        </div>

        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Reload'}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      <section className="card p-5 sm:p-6">
        <div className="text-sm font-semibold text-slate-900">Create user</div>
        <form onSubmit={submitCreate} className="mt-4 grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input className="input mt-1" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
          </div>
          <div className="sm:col-span-4">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="input mt-1"
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
            />
          </div>
          <div className="sm:col-span-4">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input className="input mt-1" value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select className="input mt-1" value={createRole} onChange={(e) => setCreateRole(e.target.value as UserRole)}>
              <option value="VIEWER">Viewer</option>
              <option value="ANALYST">Analyst</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              className="input mt-1"
              value={createStatus}
              onChange={(e) => setCreateStatus(e.target.value as UserStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="sm:col-span-6 flex items-end justify-end">
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div className="col-span-6">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-200">
            {!data || data.items.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-600">No users</div>
            ) : (
              data.items.map((u) => (
                <div key={u.id} className="px-3 py-3">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-6 min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">{u.email}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">{u.name ?? '—'}</div>
                    </div>

                    <div className="col-span-2 text-sm text-slate-700">{u.role}</div>
                    <div className="col-span-2 text-sm text-slate-700">{u.status}</div>

                    <div className="col-span-2 flex justify-end gap-2">
                      {editingId === u.id ? (
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
                          <button className="btn btn-ghost" onClick={() => startEdit(u)}>
                            Edit
                          </button>
                          <button className="btn btn-ghost" onClick={() => void deactivate(u.id)}>
                            Deactivate
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === u.id ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-6">
                        <label className="text-sm font-medium text-slate-700">Name</label>
                        <input className="input mt-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-slate-700">Role</label>
                        <select className="input mt-1" value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
                          <option value="VIEWER">Viewer</option>
                          <option value="ANALYST">Analyst</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select
                          className="input mt-1"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
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
