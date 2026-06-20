import type { Settings, Transaction } from '../types';
import { CATEGORY_COLORS } from '../types';
import {
  balance,
  currentMonthLabel,
  formatMoney,
  formatSignedAmount,
  outAllocation,
  sortByDateDesc,
  totalIn,
  totalOut,
} from '../lib/stats';

interface Props {
  transactions: Transaction[];
  settings: Settings;
  onSeeAll: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onSelectCategory: (category: string) => void;
}

export function FlowScreen({
  transactions,
  settings,
  onSeeAll,
  onSelectTransaction,
  onSelectCategory,
}: Props) {
  const bal = balance(transactions, settings);
  const tin = totalIn(transactions);
  const tout = totalOut(transactions);
  const allocation = outAllocation(transactions, CATEGORY_COLORS);
  const recent = sortByDateDesc(transactions).slice(0, 3);

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div
          className="serif"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          F
        </div>
        <span className="eyebrow">{currentMonthLabel()}</span>
      </header>

      <section style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Total balance
        </p>
        <p className="balance-figure">{formatMoney(bal, settings.showCents)}</p>
      </section>

      <section
        className="card"
        style={{
          display: 'flex',
          padding: '20px 0',
          marginBottom: 32,
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            In
          </p>
          <p className="serif amount-in" style={{ fontSize: 28, fontWeight: 500 }}>
            {formatMoney(tin, settings.showCents)}
          </p>
        </div>
        <div className="hairline-v" />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            Out
          </p>
          <p className="serif amount-out" style={{ fontSize: 28, fontWeight: 500 }}>
            {formatMoney(tout, settings.showCents)}
          </p>
        </div>
      </section>

      {allocation.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Allocation
          </p>
          <div className="allocation-bar" style={{ marginBottom: 16 }}>
            {allocation.map((item) => (
              <div
                key={item.category}
                className="allocation-segment"
                style={{
                  flex: item.amount,
                  background: item.color,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allocation.map((item) => (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectCategory(item.category)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 14 }}>{item.category}</span>
                <span className="serif" style={{ fontSize: 18, fontWeight: 500 }}>
                  {formatMoney(item.amount, settings.showCents)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="eyebrow">Recent</p>
          <button
            type="button"
            onClick={onSeeAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            See all
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {recent.map((tx, i) => (
            <div key={tx.id}>
              <RecentRow
                tx={tx}
                settings={settings}
                onClick={() => onSelectTransaction(tx)}
              />
              {i < recent.length - 1 && <hr className="row-divider" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RecentRow({
  tx,
  settings,
  onClick,
}: {
  tx: Transaction;
  settings: Settings;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.why} · {tx.category}
        </p>
      </div>
      <p
        className={`serif ${tx.dir === 'in' ? 'amount-in' : 'amount-out'}`}
        style={{ fontSize: 20, fontWeight: 500, margin: 0 }}
      >
        {formatSignedAmount(tx.amount, tx.dir, settings.showCents)}
      </p>
    </button>
  );
}
