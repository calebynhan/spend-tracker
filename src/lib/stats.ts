import type { Category, Transaction } from '../types';
import { CATEGORY_META } from '../types';

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  label: string;
  color: string;
  icon: string;
}

export interface DashboardStats {
  totalIn: number;
  totalOut: number;
  net: number;
  investing: number;
  necessity: number;
  fun: number;
  peerOut: number;
  peerIn: number;
  income: number;
  subscriptions: number;
  byCategory: CategorySummary[];
  peerOutReasons: { reason: string; amount: number; person?: string }[];
}

const SPENDING_CATEGORIES: Category[] = [
  'investing',
  'necessity',
  'fun',
  'peer_out',
  'subscription',
  'credit_card',
];

export function computeStats(transactions: Transaction[]): DashboardStats {
  let totalIn = 0;
  let totalOut = 0;
  const categoryTotals = new Map<Category, { total: number; count: number }>();
  const peerOutReasons: { reason: string; amount: number; person?: string }[] = [];

  for (const t of transactions) {
    if (t.category === 'internal_transfer') continue;

    if (t.direction === 'in') {
      totalIn += t.amount;
    } else {
      totalOut += t.amount;
    }

    const existing = categoryTotals.get(t.category) ?? { total: 0, count: 0 };
    existing.total += t.amount;
    existing.count += 1;
    categoryTotals.set(t.category, existing);

    if (t.category === 'peer_out') {
      peerOutReasons.push({
        reason: t.reason ?? 'No reason specified',
        amount: t.amount,
        person: t.person,
      });
    }
  }

  const byCategory: CategorySummary[] = Array.from(categoryTotals.entries())
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      label: CATEGORY_META[category].label,
      color: CATEGORY_META[category].color,
      icon: CATEGORY_META[category].icon,
    }))
    .sort((a, b) => b.total - a.total);

  const sum = (cat: Category) => categoryTotals.get(cat)?.total ?? 0;

  return {
    totalIn,
    totalOut,
    net: totalIn - totalOut,
    investing: sum('investing'),
    necessity: sum('necessity'),
    fun: sum('fun'),
    peerOut: sum('peer_out'),
    peerIn: sum('peer_in'),
    income: sum('income'),
    subscriptions: sum('subscription'),
    byCategory,
    peerOutReasons,
  };
}

export function filterTransactions(
  transactions: Transaction[],
  query: string,
  categoryFilter: Category | 'all',
): Transaction[] {
  const q = query.toLowerCase().trim();
  return transactions.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (!q) return true;
    return (
      t.description.toLowerCase().includes(q) ||
      t.reason?.toLowerCase().includes(q) ||
      t.person?.toLowerCase().includes(q) ||
      t.source?.toLowerCase().includes(q)
    );
  });
}

export { SPENDING_CATEGORIES };
