type AuthState = {
  token: string | null;
};

const KEY = 'finance_dashboard_token';

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(KEY);
  },
  get(): AuthState {
    return { token: localStorage.getItem(KEY) };
  },
  setToken(token: string) {
    localStorage.setItem(KEY, token);
    window.dispatchEvent(new Event('auth:changed'));
  },
  clear() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('auth:changed'));
  },
};
