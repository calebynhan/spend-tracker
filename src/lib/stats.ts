import type { FeedFilter, Settings, Transaction } from '../types';
import { OUT_CATEGORIES } from '../types';

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export function filterFeed(transactions: Transaction[], filter: FeedFilter): Transaction[] {
  if (filter === 'all') return transactions;
  return transactions.filter((t) => t.dir === filter);
}

export function totalIn(transactions: Transaction[]): number {
  return transactions.filter((t) => t.dir === 'in').reduce((s, t) => s + t.amount, 0);
}

export function totalOut(transactions: Transaction[]): number {
  return transactions.filter((t) => t.dir === 'out').reduce((s, t) => s + t.amount, 0);
}

export function balance(transactions: Transaction[], settings: Settings): number {
  return settings.openingBalance + totalIn(transactions) - totalOut(transactions);
}

export interface AllocationItem {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

export function outAllocation(
  transactions: Transaction[],
  colors: Record<string, string>,
): AllocationItem[] {
  const outTxns = transactions.filter((t) => t.dir === 'out');
  const total = outTxns.reduce((s, t) => s + t.amount, 0);
  if (total === 0) return [];

  const byCat = new Map<string, number>();
  for (const t of outTxns) {
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
  }

  return OUT_CATEGORIES.filter((c) => byCat.has(c))
    .map((category) => {
      const amount = byCat.get(category) ?? 0;
      return {
        category,
        amount,
        percent: Math.round((amount / total) * 100),
        color: colors[category] ?? '#9a8f78',
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface BucketSummary {
  category: string;
  amount: number;
  count: number;
  percent: number;
  color: string;
}

export function bucketSummaries(
  transactions: Transaction[],
  colors: Record<string, string>,
): BucketSummary[] {
  const outTxns = transactions.filter((t) => t.dir === 'out');
  const total = outTxns.reduce((s, t) => s + t.amount, 0);

  const byCat = new Map<string, { amount: number; count: number }>();
  for (const t of outTxns) {
    const cur = byCat.get(t.category) ?? { amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    byCat.set(t.category, cur);
  }

  return OUT_CATEGORIES.filter((c) => byCat.has(c))
    .map((category) => {
      const { amount, count } = byCat.get(category)!;
      return {
        category,
        amount,
        count,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: colors[category] ?? '#9a8f78',
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface ReasonPill {
  why: string;
  amount: number;
}

export function reasonPillsForCategory(
  transactions: Transaction[],
  category: string,
): ReasonPill[] {
  const txns = transactions.filter((t) => t.dir === 'out' && t.category === category);
  const byWhy = new Map<string, number>();
  for (const t of txns) {
    const key = t.why || 'No reason';
    byWhy.set(key, (byWhy.get(key) ?? 0) + t.amount);
  }
  return Array.from(byWhy.entries())
    .map(([why, amount]) => ({ why, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function transactionsForCategory(
  transactions: Transaction[],
  category: string,
): Transaction[] {
  return sortByDateDesc(
    transactions.filter((t) => t.dir === 'out' && t.category === category),
  );
}

export function formatMoney(amount: number, showCents: boolean): string {
  if (showCents) {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatSignedAmount(
  amount: number,
  dir: 'in' | 'out',
  showCents: boolean,
): string {
  const prefix = dir === 'in' ? '+' : '−';
  if (showCents) {
    return `${prefix}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${prefix}$${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
