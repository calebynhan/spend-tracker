export type Direction = 'in' | 'out';

export type OutCategory = 'Investing' | 'Necessity' | 'Sent to people' | 'Fun' | 'Other';
export type InCategory = 'Income' | 'Repayment' | 'Other';
export type Category = OutCategory | InCategory;

export interface Transaction {
  id: number;
  dir: Direction;
  amount: number;
  category: string;
  title: string;
  who: string;
  why: string;
  date: string;
  method: string;
}

export type Screen =
  | 'flow'
  | 'activity'
  | 'add'
  | 'buckets'
  | 'trends'
  | 'category-detail'
  | 'transaction-detail';

export type FeedFilter = 'all' | 'in' | 'out';

export interface Settings {
  openingBalance: number;
  showCents: boolean;
}

export interface AddFormState {
  dir: Direction;
  amount: string;
  category: string;
  who: string;
  why: string;
  date: string;
  method: string;
  editingId: number | null;
}

export const OUT_CATEGORIES: OutCategory[] = [
  'Investing',
  'Necessity',
  'Sent to people',
  'Fun',
  'Other',
];

export const IN_CATEGORIES: InCategory[] = ['Income', 'Repayment', 'Other'];

export const CATEGORY_COLORS: Record<string, string> = {
  Investing: '#23201a',
  Necessity: '#9c7b45',
  'Sent to people': '#b8a98c',
  Fun: '#d8cdb8',
  Income: '#6f7d4f',
  Repayment: '#a9b487',
  Other: '#9a8f78',
};

export const DEFAULT_SETTINGS: Settings = {
  openingBalance: 7880,
  showCents: false,
};

export const DEFAULT_ADD_FORM: AddFormState = {
  dir: 'out',
  amount: '',
  category: 'Necessity',
  who: '',
  why: '',
  date: new Date().toISOString().slice(0, 10),
  method: '',
  editingId: null,
};
