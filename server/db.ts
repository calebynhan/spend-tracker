import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Transaction } from '../src/types.ts';
import { SEED_TRANSACTIONS } from '../src/data/seedTransactions.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'flow.db');

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
    account TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT,
    reason TEXT,
    method TEXT,
    person TEXT,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
`);

const rowToTransaction = (row: Record<string, unknown>): Transaction => ({
  id: row.id as string,
  date: row.date as string,
  description: row.description as string,
  amount: row.amount as number,
  direction: row.direction as Transaction['direction'],
  account: row.account as Transaction['account'],
  category: row.category as Transaction['category'],
  source: (row.source as string) || undefined,
  reason: (row.reason as string) || undefined,
  method: (row.method as string) || undefined,
  person: (row.person as string) || undefined,
  notes: (row.notes as string) || undefined,
});

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO transactions
    (id, date, description, amount, direction, account, category, source, reason, method, person, notes)
  VALUES
    (@id, @date, @description, @amount, @direction, @account, @category, @source, @reason, @method, @person, @notes)
`);

const getSeeded = db.prepare(`SELECT value FROM meta WHERE key = 'seeded'`).get() as
  | { value: string }
  | undefined;

if (!getSeeded || getSeeded.value !== 'true') {
  const insertMany = db.transaction((txs: Transaction[]) => {
    for (const t of txs) {
      insertStmt.run({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        direction: t.direction,
        account: t.account,
        category: t.category,
        source: t.source ?? null,
        reason: t.reason ?? null,
        method: t.method ?? null,
        person: t.person ?? null,
        notes: t.notes ?? null,
      });
    }
  });
  insertMany(SEED_TRANSACTIONS);
  db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', 'true')`).run();
}

export function getAllTransactions(): Transaction[] {
  const rows = db
    .prepare(`SELECT * FROM transactions ORDER BY date DESC, id DESC`)
    .all() as Record<string, unknown>[];
  return rows.map(rowToTransaction);
}

export function getTransaction(id: string): Transaction | null {
  const row = db.prepare(`SELECT * FROM transactions WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToTransaction(row) : null;
}

export function insertTransaction(t: Transaction): Transaction {
  insertStmt.run({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    direction: t.direction,
    account: t.account,
    category: t.category,
    source: t.source ?? null,
    reason: t.reason ?? null,
    method: t.method ?? null,
    person: t.person ?? null,
    notes: t.notes ?? null,
  });
  return t;
}

export function updateTransaction(t: Transaction): Transaction | null {
  const existing = getTransaction(t.id);
  if (!existing) return null;
  insertTransaction(t);
  return t;
}

export function deleteTransaction(id: string): boolean {
  const result = db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function getStats() {
  const txs = getAllTransactions().filter((t) => t.category !== 'internal_transfer');
  let totalIn = 0;
  let totalOut = 0;
  const byCategory: Record<string, { total: number; count: number }> = {};

  for (const t of txs) {
    if (t.direction === 'in') totalIn += t.amount;
    else totalOut += t.amount;
    const cat = byCategory[t.category] ?? { total: 0, count: 0 };
    cat.total += t.amount;
    cat.count += 1;
    byCategory[t.category] = cat;
  }

  return { totalIn, totalOut, net: totalIn - totalOut, count: txs.length, byCategory };
}
