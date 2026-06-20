import type { Settings, Transaction } from '../types';

export interface AppState {
  transactions: Transaction[];
  settings: Settings;
}

interface HealthResponse {
  ok: boolean;
  authRequired: boolean;
}

const ACCESS_KEY_STORAGE_KEY = 'mf_access_key';

function getAccessKey(): string | null {
  return sessionStorage.getItem(ACCESS_KEY_STORAGE_KEY);
}

function setAccessKey(value: string): void {
  sessionStorage.setItem(ACCESS_KEY_STORAGE_KEY, value);
}

function accessKeyHeaders(): HeadersInit {
  const key = getAccessKey();
  return key ? { 'X-Flow-Access-Key': key } : {};
}

async function promptForAccessKey(): Promise<string | null> {
  const key = window.prompt('Enter your Flow access key');
  if (!key) return null;
  setAccessKey(key);
  return key;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...accessKeyHeaders(),
      ...init?.headers,
    },
    ...init,
  });

  if (res.status === 401) {
    const key = await promptForAccessKey();
    if (key) {
      return request<T>(path, init);
    }
  }

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function canReachApi(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/health', { signal: controller.signal });
    window.clearTimeout(timeout);
    if (res.ok) {
      const health = (await res.json()) as HealthResponse;
      if (health.authRequired && !getAccessKey()) {
        await promptForAccessKey();
      }
    }
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  loadState: () => request<AppState>('/state'),
  saveState: (state: AppState) =>
    request<AppState>('/state', {
      method: 'PUT',
      body: JSON.stringify(state),
    }),
};
