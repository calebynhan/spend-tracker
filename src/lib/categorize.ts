import type { Category, Transaction } from '../types';

interface CategorizeInput {
  description: string;
  amount: number;
  direction: 'in' | 'out';
}

const INVESTING_PATTERNS = [
  /charles schwab/i,
  /fidelity/i,
  /national financial/i,
  /schwab brokerage/i,
  /moneylink/i,
];

const PEER_IN_PATTERNS = [/^venmo$/i, /^zelle/i, /zelle:/i];
const PEER_OUT_PATTERNS = [/^zelle$/i];

const INCOME_PATTERNS = [
  /collage ai/i,
  /payroll/i,
  /^interest$/i,
  /check deposit/i,
  /^sofi$/i,
  /wells fargo/i,
];

const FUN_PATTERNS = [
  /uber/i,
  /in-n-out/i,
  /noodle st/i,
  /brkfst|lax cnp/i,
  /seesaw beans/i,
  /burger/i,
  /coffee/i,
];

const NECESSITY_PATTERNS = [/^mta$/i, /^mbta$/i, /transport/i];

const SUBSCRIPTION_PATTERNS = [/google one/i, /adobe/i];

const CREDIT_CARD_PATTERNS = [/discover/i];

const INTERNAL_PATTERNS = [/transfer (from|to) savings/i, /transfer to savings/i];

const REFUND_PATTERNS = [/refund/i];

export function categorize({ description, amount, direction }: CategorizeInput): Category {
  const desc = description.trim();

  if (INTERNAL_PATTERNS.some((p) => p.test(desc))) return 'internal_transfer';

  if (INVESTING_PATTERNS.some((p) => p.test(desc))) {
    return direction === 'out' ? 'investing' : 'income';
  }

  if (CREDIT_CARD_PATTERNS.some((p) => p.test(desc))) {
    return direction === 'out' ? 'credit_card' : 'refund';
  }

  if (direction === 'in') {
    if (PEER_IN_PATTERNS.some((p) => p.test(desc))) return 'peer_in';
    if (INCOME_PATTERNS.some((p) => p.test(desc))) return 'income';
    if (REFUND_PATTERNS.some((p) => p.test(desc))) return 'refund';
    if (/adobe/i.test(desc) && amount < 50) return 'refund';
  }

  if (direction === 'out') {
    if (PEER_OUT_PATTERNS.some((p) => p.test(desc))) return 'peer_out';
    if (SUBSCRIPTION_PATTERNS.some((p) => p.test(desc))) return 'subscription';
    if (FUN_PATTERNS.some((p) => p.test(desc))) return 'fun';
    if (NECESSITY_PATTERNS.some((p) => p.test(desc))) return 'necessity';
  }

  return 'other';
}

export function inferMetadata(description: string, category: Category): Partial<Transaction> {
  const meta: Partial<Transaction> = {};

  if (/zelle:\s*(.+)/i.test(description)) {
    const person = description.match(/zelle:\s*(.+)/i)?.[1];
    if (person) {
      meta.person = person.trim();
      meta.source = person.trim();
      meta.method = 'Zelle';
    }
  } else if (/^venmo$/i.test(description)) {
    meta.method = 'Venmo';
    meta.source = 'Venmo';
  } else if (/^zelle$/i.test(description)) {
    meta.method = 'Zelle';
  } else if (/collage ai/i.test(description)) {
    meta.source = 'Collage AI, Inc.';
    meta.reason = 'Payroll';
    meta.method = 'Direct deposit';
  } else if (/charles schwab|schwab brokerage/i.test(description)) {
    meta.source = 'Charles Schwab';
    meta.reason = 'Investment contribution';
    meta.method = 'Brokerage transfer';
  } else if (/fidelity/i.test(description)) {
    meta.source = 'Fidelity Investments';
    meta.reason = 'Investment contribution';
    meta.method = 'Brokerage transfer';
  } else if (/discover/i.test(description)) {
    meta.source = 'Discover Card';
    meta.reason = 'Credit card bill payment';
    meta.method = 'Bank transfer';
  } else if (/uber/i.test(description)) {
    meta.source = 'Uber';
    meta.reason = 'Ride';
    meta.method = 'App';
  } else if (/google one/i.test(description)) {
    meta.source = 'Google';
    meta.reason = 'Cloud storage subscription';
    meta.method = 'Auto-pay';
  } else if (/adobe/i.test(description)) {
    meta.source = 'Adobe';
    meta.reason = 'Creative Cloud subscription';
    meta.method = 'Auto-pay';
  } else if (/interest/i.test(description)) {
    meta.source = 'Bank interest';
    meta.reason = 'Savings interest';
    meta.method = 'Automatic';
  } else if (/transfer/i.test(description)) {
    meta.method = 'Internal transfer';
    meta.reason = 'Move money between accounts';
  }

  if (category === 'peer_out') {
    meta.method = 'Zelle';
    meta.reason = meta.reason ?? 'Sent to someone';
  }

  return meta;
}

export function createTransaction(
  partial: Omit<Transaction, 'id' | 'category'> & { category?: Category },
): Transaction {
  const direction = partial.direction;
  const category =
    partial.category ??
    categorize({
      description: partial.description,
      amount: partial.amount,
      direction,
    });
  const inferred = inferMetadata(partial.description, category);

  return {
    id: partial.id ?? crypto.randomUUID(),
    date: partial.date,
    description: partial.description,
    amount: partial.amount,
    direction,
    account: partial.account,
    category,
    ...inferred,
    ...partial,
    category,
  };
}
