import { useMemo, useState } from 'react';
import type { Category, Transaction } from '../types';
import { CATEGORY_META } from '../types';
import { formatDate, groupByDate } from '../lib/format';
import { filterTransactions } from '../lib/stats';
import { TransactionCard, TransactionDetail } from './TransactionCard';

interface Props {
  transactions: Transaction[];
  onUpdate?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function ActivityList({ transactions, onUpdate, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () => filterTransactions(transactions, query, categoryFilter),
    [transactions, query, categoryFilter],
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const sortedDates = useMemo(
    () => Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a)),
    [grouped],
  );

  return (
    <div className="px-4 pb-28 pt-2">
      <div className="sticky top-0 z-10 -mx-4 bg-black/90 px-4 pb-3 pt-1 backdrop-blur-md">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
            <input
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl bg-surface-card py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-surface-border"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl px-4 py-2.5 ${showFilters ? 'bg-accent-blue text-white' : 'bg-surface-card text-gray-400'}`}
          >
            ☰
          </button>
        </div>
        {showFilters && (
          <div className="mt-2 flex flex-wrap gap-2">
            <FilterChip
              label="All"
              active={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
            />
            {(Object.keys(CATEGORY_META) as Category[]).map((cat) => (
              <FilterChip
                key={cat}
                label={CATEGORY_META[cat].label}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {sortedDates.length === 0 && (
          <p className="py-12 text-center text-gray-500">No transactions found</p>
        )}
        {sortedDates.map((date) => (
          <section key={date}>
            <h3 className="mb-2 text-sm font-medium text-gray-400">{formatDate(date)}</h3>
            <div className="space-y-2">
              {(grouped.get(date) ?? []).map((t) => (
                <TransactionCard key={t.id} transaction={t} onClick={() => setSelected(t)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <TransactionDetail
          transaction={selected}
          onClose={() => setSelected(null)}
          onUpdate={(tx) => {
            onUpdate?.(tx);
            setSelected(tx);
          }}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-white text-black' : 'bg-surface-card text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
