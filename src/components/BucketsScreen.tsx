import type { Settings, Transaction } from '../types';
import { CATEGORY_COLORS } from '../types';
import { bucketSummaries, formatMoney } from '../lib/stats';

interface Props {
  transactions: Transaction[];
  settings: Settings;
  onSelectCategory: (category: string) => void;
}

export function BucketsScreen({ transactions, settings, onSelectCategory }: Props) {
  const buckets = bucketSummaries(transactions, CATEGORY_COLORS);

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 24px' }}>
        Buckets
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {buckets.length === 0 && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
            No spending yet
          </p>
        )}
        {buckets.map((b) => (
          <button
            key={b.category}
            type="button"
            className="card"
            onClick={() => onSelectCategory(b.category)}
            style={{
              padding: 18,
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: b.color,
                }}
              />
              <span style={{ flex: 1, fontWeight: 500, fontSize: 15 }}>{b.category}</span>
              <span className="serif" style={{ fontSize: 24, fontWeight: 500 }}>
                {formatMoney(b.amount, settings.showCents)}
              </span>
            </div>
            <div className="share-bar" style={{ marginBottom: 8 }}>
              <div
                className="share-bar-fill"
                style={{ width: `${b.percent}%`, background: b.color }}
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              {b.count} {b.count === 1 ? 'item' : 'items'} · {b.percent}%
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
