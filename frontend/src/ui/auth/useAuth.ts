import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { authStore } from './authStore';

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener('storage', handler);
  window.addEventListener('auth:changed', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('auth:changed', handler);
  };
}

function getSnapshot() {
  return authStore.getToken();
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const api = useMemo(() => {
    return {
      token,
      setToken: authStore.setToken,
      logout: authStore.clear,
    };
  }, [token]);

  useEffect(() => {
    // no-op; just ensures hook is used in client
  }, []);

  return api;
}
