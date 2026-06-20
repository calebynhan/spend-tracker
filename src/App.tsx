import { useCallback, useEffect, useState } from 'react';
import type { AddFormState, Screen, Settings, Transaction } from './types';
import { DEFAULT_ADD_FORM } from './types';
import { loadAppState, nextId, saveAppState } from './lib/storage';
import { buildTitle, transactionToForm } from './lib/voiceParser';
import { TabBar } from './components/TabBar';
import { FlowScreen } from './components/FlowScreen';
import { ActivityScreen } from './components/ActivityScreen';
import { BucketsScreen } from './components/BucketsScreen';
import { CategoryDetailScreen } from './components/CategoryDetailScreen';
import { TransactionDetailScreen } from './components/TransactionDetailScreen';
import { AddScreen } from './components/AddScreen';
import { TrendsScreen } from './components/TrendsScreen';

const MAIN_SCREENS: Screen[] = ['flow', 'activity', 'add', 'buckets', 'trends'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('flow');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>({ openingBalance: 7880, showCents: false });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryReturnScreen, setCategoryReturnScreen] = useState<Screen>('buckets');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [feedFilter, setFeedFilter] = useState<'all' | 'in' | 'out'>('all');
  const [addForm, setAddForm] = useState<AddFormState>(DEFAULT_ADD_FORM);
  const [backendOnline, setBackendOnline] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadAppState().then(({ state, backendOnline }) => {
      if (cancelled) return;
      setTransactions(state.transactions);
      setSettings(state.settings);
      setBackendOnline(backendOnline);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((txns: Transaction[]) => {
    setTransactions(txns);
    saveAppState({ transactions: txns, settings }, backendOnline).then(setBackendOnline);
  }, [backendOnline, settings]);

  const handleSave = useCallback(() => {
    const amount = parseFloat(addForm.amount);
    if (isNaN(amount) || amount <= 0) return;

    const title = buildTitle(addForm.dir, addForm.category, addForm.who);
    let next = [...transactions];

    if (addForm.editingId !== null) {
      next = next.filter((t) => t.id !== addForm.editingId);
    }

    const tx: Transaction = {
      id: addForm.editingId ?? nextId(next),
      dir: addForm.dir,
      amount,
      category: addForm.category,
      title,
      who: addForm.who,
      why: addForm.why,
      date: addForm.date,
      method: addForm.method,
    };

    persist([...next, tx]);
    setAddForm({ ...DEFAULT_ADD_FORM, date: new Date().toISOString().slice(0, 10) });
    setScreen('activity');
  }, [addForm, transactions, persist]);

  const handleEdit = useCallback((tx: Transaction) => {
    setAddForm(transactionToForm(tx));
    setSelectedTransaction(null);
    setScreen('add');
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      persist(transactions.filter((t) => t.id !== id));
      setSelectedTransaction(null);
      setScreen('activity');
    },
    [transactions, persist],
  );

  const navigate = (s: Screen) => {
    if (s !== 'category-detail') setSelectedCategory(null);
    if (s !== 'transaction-detail') setSelectedTransaction(null);
    if (s === 'add' && addForm.editingId === null) {
      setAddForm({ ...DEFAULT_ADD_FORM, date: new Date().toISOString().slice(0, 10) });
    }
    setScreen(s);
  };

  const showNav = MAIN_SCREENS.includes(screen);

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="phone" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="phone">
        <div className={`screen-content ${showNav ? '' : 'no-nav'}`}>
          {screen === 'flow' && (
            <FlowScreen
              transactions={transactions}
              settings={settings}
              onSeeAll={() => navigate('activity')}
              onSelectTransaction={(tx) => {
                setSelectedTransaction(tx);
                setScreen('transaction-detail');
              }}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCategoryReturnScreen('flow');
                setScreen('category-detail');
              }}
            />
          )}

          {screen === 'activity' && (
            <ActivityScreen
              transactions={transactions}
              settings={settings}
              filter={feedFilter}
              onFilterChange={setFeedFilter}
              onSelect={(tx) => {
                setSelectedTransaction(tx);
                setScreen('transaction-detail');
              }}
            />
          )}

          {screen === 'buckets' && (
            <BucketsScreen
              transactions={transactions}
              settings={settings}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCategoryReturnScreen('buckets');
                setScreen('category-detail');
              }}
            />
          )}

          {screen === 'trends' && <TrendsScreen />}

          {screen === 'category-detail' && selectedCategory && (
            <CategoryDetailScreen
              category={selectedCategory}
              transactions={transactions}
              settings={settings}
              onBack={() => navigate(categoryReturnScreen)}
              onSelectTransaction={(tx) => {
                setSelectedTransaction(tx);
                setScreen('transaction-detail');
              }}
            />
          )}

          {screen === 'transaction-detail' && selectedTransaction && (
            <TransactionDetailScreen
              transaction={selectedTransaction}
              settings={settings}
              onBack={() => navigate('activity')}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {screen === 'add' && (
            <AddScreen form={addForm} onChange={setAddForm} onSave={handleSave} />
          )}
        </div>

        <TabBar active={screen} onNavigate={navigate} show={showNav} />
      </div>
    </div>
  );
}
