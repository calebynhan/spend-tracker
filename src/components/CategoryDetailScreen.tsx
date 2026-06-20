import type { Settings, Transaction } from '../types';
import { CATEGORY_COLORS } from '../types';
import {
  formatMoney,
  formatShortDate,
  reasonPillsForCategory,
  transactionsForCategory,
} from '../lib/stats';

interface Props {
  category: string;
  transactions: Transaction[];
  settings: Settings;
  onBack: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export function CategoryDetailScreen({
  category,
  transactions,
  settings,
  onBack,
  onSelectTransaction,
}: Props) {
  const txns = transactionsForCategory(transactions, category);
  const total = txns.reduce((s, t) => s + t.amount, 0);
  const pills = reasonPillsForCategory(transactions, category);
  const color = CATEGORY_COLORS[category] ?? '#9a8f78';

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        ← Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: 0 }}>
          {category}
        </h1>
      </div>

      <p className="serif" style={{ fontSize: 22, color: 'var(--muted)', margin: '0 0 24px' }}>
        {formatMoney(total, settings.showCents)} · {txns.length}{' '}
        {txns.length === 1 ? 'item' : 'items'}
      </p>

      {pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {pills.map((p) => (
            <span
              key={p.why}
              style={{
                background: 'var(--pill-bg)',
                borderRadius: 'var(--chip-radius)',
                padding: '8px 14px',
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              {p.why} · {formatMoney(p.amount, settings.showCents)}
            </span>
          ))}
        </div>
      )}

      <div>
        {txns.map((tx, i) => (
          <div key={tx.id}>
            <button
              type="button"
              onClick={() => onSelectTransaction(tx)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '14px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <p style={{ fontWeight: 500, margin: 0 }}>{tx.who || tx.title}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                  {tx.why} · {formatShortDate(tx.date)}
                </p>
              </div>
              <span className="serif amount-out" style={{ fontSize: 20, fontWeight: 500 }}>
                −{formatMoney(tx.amount, settings.showCents).replace('$', '$')}
              </span>
            </button>
            {i < txns.length - 1 && <hr className="row-divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}
