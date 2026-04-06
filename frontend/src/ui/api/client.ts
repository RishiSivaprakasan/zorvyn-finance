import { authStore } from '../auth/authStore';

export type ApiErrorShape = {
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
};

const baseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5000';

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorShape;
    return (
      data?.error?.message ??
      data?.message ??
      `Request failed (${res.status})`
    );
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  // ✅ FIX: read correct token from localStorage
  const token = localStorage.getItem("finance_dashboard_token");

  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');

  if (init?.body) headers.set('Content-Type', 'application/json');

  // ✅ Attach token properly
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const msg = await readError(res);
    throw new Error(msg);
  }

  return (await res.json()) as T;
}