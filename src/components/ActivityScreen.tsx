import type { FeedFilter, Settings, Transaction } from '../types';
import {
  filterFeed,
  formatShortDate,
  formatSignedAmount,
  sortByDateDesc,
} from '../lib/stats';

interface Props {
  transactions: Transaction[];
  settings: Settings;
  filter: FeedFilter;
  onFilterChange: (f: FeedFilter) => void;
  onSelect: (tx: Transaction) => void;
}

export function ActivityScreen({
  transactions,
  settings,
  filter,
  onFilterChange,
  onSelect,
}: Props) {
  const sorted = sortByDateDesc(transactions);
  const filtered = filterFeed(sorted, filter);

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 20px' }}>
        Activity
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['all', 'in', 'out'] as FeedFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f === 'all' ? 'All' : f === 'in' ? 'In' : 'Out'}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
            No transactions yet
          </p>
        )}
        {filtered.map((tx, i) => (
          <div key={tx.id}>
            <button
              type="button"
              onClick={() => onSelect(tx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '14px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div className={`icon-circle ${tx.dir}`}>{tx.dir === 'in' ? '↑' : '↓'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{tx.title}</p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    margin: '2px 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tx.why} · {tx.category}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  className={`serif ${tx.dir === 'in' ? 'amount-in' : 'amount-out'}`}
                  style={{ fontSize: 20, fontWeight: 500, margin: 0 }}
                >
                  {formatSignedAmount(tx.amount, tx.dir, settings.showCents)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: '2px 0 0' }}>
                  {formatShortDate(tx.date)}
                </p>
              </div>
            </button>
            {i < filtered.length - 1 && <hr className="row-divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}
