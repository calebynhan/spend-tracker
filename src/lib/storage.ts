import type { Settings, Transaction } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { api, canReachApi, type AppState } from './api';
import { SEED_TRANSACTIONS } from './seed';

const TXN_KEY = 'mf_txns';
const SETTINGS_KEY = 'mf_settings';
const SEEDED_KEY = 'mf_seeded';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTransactions(): Transaction[] {
  const seeded = localStorage.getItem(SEEDED_KEY);
  if (!seeded) {
    localStorage.setItem(TXN_KEY, JSON.stringify(SEED_TRANSACTIONS));
    localStorage.setItem(SEEDED_KEY, 'true');
    return [...SEED_TRANSACTIONS];
  }
  return loadJSON<Transaction[]>(TXN_KEY, []);
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TXN_KEY, JSON.stringify(transactions));
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...loadJSON<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function nextId(transactions: Transaction[]): number {
  if (transactions.length === 0) return 1;
  return Math.max(...transactions.map((t) => t.id)) + 1;
}

function saveLocalState(state: AppState): void {
  saveTransactions(state.transactions);
  saveSettings(state.settings);
  localStorage.setItem(SEEDED_KEY, 'true');
}

export async function loadAppState(): Promise<{ state: AppState; backendOnline: boolean }> {
  const backendOnline = await canReachApi();
  if (backendOnline) {
    try {
      const state = await api.loadState();
      saveLocalState(state);
      return { state, backendOnline: true };
    } catch {
      // Fall back to the browser cache if the backend briefly fails after health check.
    }
  }

  return {
    state: {
      transactions: loadTransactions(),
      settings: loadSettings(),
    },
    backendOnline: false,
  };
}

export async function saveAppState(
  state: AppState,
  backendOnline: boolean,
): Promise<boolean> {
  saveLocalState(state);

  if (!backendOnline) return false;

  try {
    await api.saveState(state);
    return true;
  } catch {
    return false;
  }
}
