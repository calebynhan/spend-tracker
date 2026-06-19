import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tab, Transaction } from './types';
import {
  initStorage,
  addTransaction as saveTransaction,
  updateTransaction as updateStored,
  deleteTransaction as deleteStored,
  isUsingApi,
} from './lib/storage';
import { computeStats } from './lib/stats';
import { Dashboard } from './components/Dashboard';
import { ActivityList } from './components/ActivityList';
import { AddTransaction } from './components/AddTransaction';
import { TabBar } from './components/TabBar';

const TITLES: Record<Tab, string> = {
  dashboard: 'Summary',
  activity: 'Activity',
  add: 'Add',
};

function sortTransactions(txs: Transaction[]) {
  return [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiMode, setApiMode] = useState(false);

  useEffect(() => {
    initStorage().then((txs) => {
      setTransactions(txs);
      setApiMode(isUsingApi());
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => computeStats(transactions), [transactions]);

  const handleAdd = useCallback(async (tx: Transaction) => {
    await saveTransaction(tx);
    setTransactions((prev) => sortTransactions([tx, ...prev]));
    setTab('activity');
  }, []);

  const handleUpdate = useCallback(async (tx: Transaction) => {
    await updateStored(tx);
    setTransactions((prev) => sortTransactions(prev.map((t) => (t.id === tx.id ? tx : t))));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteStored(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      <header className="sticky top-0 z-30 bg-black/90 px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="text-center text-lg font-semibold">{TITLES[tab]}</h1>
        {tab === 'dashboard' && (
          <p className="mt-0.5 text-center text-xs text-gray-500">
            {transactions.length} transactions · {apiMode ? 'SQLite backend' : 'offline mode'}
          </p>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'dashboard' && <Dashboard stats={stats} />}
        {tab === 'activity' && (
          <ActivityList
            transactions={transactions}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
        {tab === 'add' && <AddTransaction onAdd={handleAdd} />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
