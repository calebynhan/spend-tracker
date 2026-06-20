import type { Settings, Transaction } from '../types';
import { formatLongDate, formatSignedAmount } from '../lib/stats';

interface Props {
  transaction: Transaction;
  settings: Settings;
  onBack: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

export function TransactionDetailScreen({
  transaction: tx,
  settings,
  onBack,
  onEdit,
  onDelete,
}: Props) {
  const handleDelete = () => {
    if (confirm('Delete this transaction?')) {
      onDelete(tx.id);
    }
  };

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        ← Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          className={`icon-circle ${tx.dir}`}
          style={{ width: 56, height: 56, fontSize: 22, margin: '0 auto 16px' }}
        >
          {tx.dir === 'in' ? '↑' : '↓'}
        </div>
        <p
          className={`serif ${tx.dir === 'in' ? 'amount-in' : 'amount-out'}`}
          style={{ fontSize: 48, fontWeight: 500, margin: '0 0 8px' }}
        >
          {formatSignedAmount(tx.amount, tx.dir, settings.showCents)}
        </p>
        <p className="serif" style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
          {tx.title}
        </p>
      </div>

      <dl>
        <DetailRow label="Why" value={tx.why || '—'} />
        <DetailRow label="Category" value={tx.category} />
        <DetailRow label={tx.dir === 'in' ? 'From' : 'To'} value={tx.who || '—'} />
        <DetailRow label="When" value={formatLongDate(tx.date)} />
        <DetailRow label="Method" value={tx.method || '—'} />
        <DetailRow label="Account" value="SoFi checking" />
      </dl>

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <button type="button" className="btn-dark" style={{ flex: 1 }} onClick={() => onEdit(tx)}>
          Edit
        </button>
        <button type="button" className="btn-ghost danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}
