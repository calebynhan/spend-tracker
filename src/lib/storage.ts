import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Transaction } from '../types';
import { SEED_TRANSACTIONS } from '../data/seedTransactions';
import { api, checkApiHealth } from './api';

interface FlowDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': string };
  };
  meta: {
    key: string;
    value: { seeded: boolean; useApi?: boolean };
  };
}

const DB_NAME = 'flow-money-tracker';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FlowDB>> | null = null;
let useApi = false;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
        db.createObjectStore('meta');
      },
    });
  }
  return dbPromise;
}

async function seedLocalDB(): Promise<Transaction[]> {
  const db = await getDB();
  const seeded = await db.get('meta', 'seeded');

  if (!seeded?.seeded) {
    const tx = db.transaction('transactions', 'readwrite');
    await Promise.all(SEED_TRANSACTIONS.map((t) => tx.store.put(t)));
    await tx.done;
    await db.put('meta', { seeded: true, useApi: false }, 'seeded');
    return SEED_TRANSACTIONS;
  }

  return getAllLocalTransactions();
}

async function getAllLocalTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transactions', 'by-date');
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

async function cacheLocally(transactions: Transaction[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('transactions', 'readwrite');
  await tx.store.clear();
  await Promise.all(transactions.map((t) => tx.store.put(t)));
  await tx.done;
  await db.put('meta', { seeded: true, useApi: true }, 'seeded');
}

export function isUsingApi(): boolean {
  return useApi;
}

export async function initStorage(): Promise<Transaction[]> {
  const apiAvailable = await checkApiHealth();
  useApi = apiAvailable;

  if (useApi) {
    try {
      const transactions = await api.getTransactions();
      await cacheLocally(transactions);
      return transactions;
    } catch {
      useApi = false;
    }
  }

  return seedLocalDB();
}

export async function getAllTransactions(): Promise<Transaction[]> {
  if (useApi) {
    try {
      const transactions = await api.getTransactions();
      await cacheLocally(transactions);
      return transactions;
    } catch {
      useApi = false;
    }
  }
  return getAllLocalTransactions();
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  if (useApi) {
    try {
      await api.addTransaction(transaction);
      const db = await getDB();
      await db.put('transactions', transaction);
      return;
    } catch {
      useApi = false;
    }
  }
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  if (useApi) {
    try {
      await api.updateTransaction(transaction);
      const db = await getDB();
      await db.put('transactions', transaction);
      return;
    } catch {
      useApi = false;
    }
  }
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function deleteTransaction(id: string): Promise<void> {
  if (useApi) {
    try {
      await api.deleteTransaction(id);
      const db = await getDB();
      await db.delete('transactions', id);
      return;
    } catch {
      useApi = false;
    }
  }
  const db = await getDB();
  await db.delete('transactions', id);
}
