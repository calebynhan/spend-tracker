import type { Transaction } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  getTransactions: () => request<Transaction[]>('/transactions'),
  addTransaction: (tx: Transaction) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(tx) }),
  updateTransaction: (tx: Transaction) =>
    request<Transaction>(`/transactions/${tx.id}`, { method: 'PUT', body: JSON.stringify(tx) }),
  deleteTransaction: (id: string) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};
