export type FlowDirection = 'in' | 'out';

export type Category =
  | 'income'
  | 'investing'
  | 'peer_in'
  | 'peer_out'
  | 'necessity'
  | 'fun'
  | 'subscription'
  | 'credit_card'
  | 'internal_transfer'
  | 'refund'
  | 'other';

export type Account = 'checking_6174' | 'savings_7033';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  direction: FlowDirection;
  account: Account;
  category: Category;
  source?: string;
  reason?: string;
  method?: string;
  person?: string;
  notes?: string;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  income: {
    id: 'income',
    label: 'Income',
    color: '#30d158',
    icon: '💰',
    description: 'Payroll, interest, deposits',
  },
  investing: {
    id: 'investing',
    label: 'Investing',
    color: '#0a84ff',
    icon: '📈',
    description: 'Transfers to brokerage accounts',
  },
  peer_in: {
    id: 'peer_in',
    label: 'Received from People',
    color: '#30d158',
    icon: '👋',
    description: 'Venmo, Zelle received',
  },
  peer_out: {
    id: 'peer_out',
    label: 'Sent to People',
    color: '#bf5af2',
    icon: '🤝',
    description: 'Money sent to friends & family',
  },
  necessity: {
    id: 'necessity',
    label: 'Necessities',
    color: '#ff9f0a',
    icon: '🏠',
    description: 'Transport, essentials',
  },
  fun: {
    id: 'fun',
    label: 'Fun',
    color: '#ff375f',
    icon: '🎉',
    description: 'Dining, rides, entertainment',
  },
  subscription: {
    id: 'subscription',
    label: 'Subscriptions',
    color: '#64d2ff',
    icon: '🔄',
    description: 'Recurring services',
  },
  credit_card: {
    id: 'credit_card',
    label: 'Credit Card Payments',
    color: '#8e8e93',
    icon: '💳',
    description: 'Paying off credit card bills',
  },
  internal_transfer: {
    id: 'internal_transfer',
    label: 'Internal Transfers',
    color: '#636366',
    icon: '↔️',
    description: 'Between your own accounts',
  },
  refund: {
    id: 'refund',
    label: 'Refunds',
    color: '#30d158',
    icon: '↩️',
    description: 'Money returned to you',
  },
  other: {
    id: 'other',
    label: 'Other',
    color: '#8e8e93',
    icon: '📋',
    description: 'Uncategorized',
  },
};

export const ACCOUNT_LABELS: Record<Account, string> = {
  checking_6174: 'Checking · 6174',
  savings_7033: 'Savings · 7033',
};

export type Tab = 'dashboard' | 'activity' | 'add';
