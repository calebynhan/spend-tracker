import { useState } from 'react';
import type { Category, Transaction } from '../types';
import { CATEGORY_META, ACCOUNT_LABELS } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { createTransaction } from '../lib/categorize';

interface Props {
  transaction: Transaction;
  onClose: () => void;
  onUpdate?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

function getIcon(category: Category, description: string): string {
  if (/uber/i.test(description)) return '🚗';
  if (/venmo/i.test(description)) return '💙';
  if (/zelle/i.test(description)) return '💜';
  if (/discover/i.test(description)) return '🔶';
  if (/schwab|fidelity/i.test(description)) return '📈';
  if (/collage/i.test(description)) return '💼';
  if (/google/i.test(description)) return '☁️';
  if (/adobe/i.test(description)) return '🔸';
  if (/interest/i.test(description)) return '✨';
  if (/burger|noodle|brkfst|coffee|seesaw/i.test(description)) return '🍽️';
  if (/mta|mbta/i.test(description)) return '🚇';
  return CATEGORY_META[category].icon;
}

export function TransactionCard({
  transaction,
  onClick,
}: {
  transaction: Transaction;
  onClick?: () => void;
}) {
  const isIn = transaction.direction === 'in';
  const meta = CATEGORY_META[transaction.category];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface-card px-4 py-3.5 text-left transition active:scale-[0.98]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xl">
        {getIcon(transaction.category, transaction.description)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{transaction.description}</p>
        <p className="truncate text-sm text-gray-400">
          {ACCOUNT_LABELS[transaction.account]}
          {transaction.reason && ` · ${transaction.reason}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-semibold tabular-nums ${isIn ? 'text-accent-green' : 'text-white'}`}>
          {isIn ? '+' : '−'}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-gray-500">{meta.label}</p>
      </div>
    </button>
  );
}

export function TransactionDetail({ transaction, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState(transaction.reason ?? '');
  const [person, setPerson] = useState(transaction.person ?? '');
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [category, setCategory] = useState(transaction.category);

  const meta = CATEGORY_META[transaction.category];
  const isIn = transaction.direction === 'in';

  const fields = [
    { label: 'Date', value: formatDate(transaction.date) },
    { label: 'Direction', value: isIn ? 'Money in' : 'Money out' },
    { label: 'Category', value: meta.label },
    { label: 'Account', value: ACCOUNT_LABELS[transaction.account] },
    { label: 'Amount', value: `${isIn ? '+' : '−'}${formatCurrency(transaction.amount)}` },
    transaction.source && { label: 'Source', value: transaction.source },
    transaction.method && { label: 'How', value: transaction.method },
    transaction.reason && !editing && { label: 'Why', value: transaction.reason },
    transaction.person && !editing && { label: 'Person', value: transaction.person },
    transaction.notes && !editing && { label: 'Notes', value: transaction.notes },
  ].filter(Boolean) as { label: string; value: string }[];

  const handleSave = () => {
    if (!onUpdate) return;
    const updated = createTransaction({
      ...transaction,
      category,
      reason: reason || undefined,
      person: person || undefined,
      notes: notes || undefined,
    });
    onUpdate(updated);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (confirm('Delete this transaction?')) {
      onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface-raised p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{transaction.description}</h2>
            <p className="text-sm text-gray-400">{CATEGORY_META[category].label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-surface-card px-3 py-1 text-sm text-gray-400"
          >
            Close
          </button>
        </div>

        {!editing ? (
          <>
            <dl className="space-y-4">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                  <dd className="mt-0.5 text-base">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex gap-2">
              {onUpdate && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex-1 rounded-xl bg-surface-card py-3 text-sm font-medium"
                >
                  Edit details
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-accent-red/20 px-4 py-3 text-sm font-medium text-accent-red"
                >
                  Delete
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Why</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl bg-surface-card px-3 py-2.5"
                placeholder="Reason for this transaction"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Person</label>
              <input
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full rounded-xl bg-surface-card px-3 py-2.5"
                placeholder="Who sent/received"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl bg-surface-card px-3 py-2.5"
              >
                {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-surface-card px-3 py-2.5"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-white py-3 font-medium text-black"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl bg-surface-card px-4 py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
