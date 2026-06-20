import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Settings, Transaction } from '../src/types';
import { DEFAULT_SETTINGS, IN_CATEGORIES, OUT_CATEGORIES } from '../src/types';
import { SEED_TRANSACTIONS } from '../src/lib/seed';

interface StoreShape {
  transactions: Transaction[];
  settings: Settings;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const storePath = join(dataDir, 'store.json');
const distPath = join(__dirname, '..', 'dist');
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
const accessKey = process.env.FLOW_ACCESS_KEY;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001,http://127.0.0.1:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

if (host !== '127.0.0.1' && host !== 'localhost' && !accessKey) {
  throw new Error(
    'FLOW_ACCESS_KEY is required when binding the backend to a non-localhost host.',
  );
}

mkdirSync(dataDir, { recursive: true });

function defaultStore(): StoreShape {
  return {
    transactions: SEED_TRANSACTIONS,
    settings: DEFAULT_SETTINGS,
  };
}

function readStore(): StoreShape {
  if (!existsSync(storePath)) {
    const initial = defaultStore();
    writeStore(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as Partial<StoreShape>;
    return {
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : SEED_TRANSACTIONS,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    const initial = defaultStore();
    writeStore(initial);
    return initial;
  }
}

function writeStore(store: StoreShape): void {
  writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function nextId(transactions: Transaction[]): number {
  if (transactions.length === 0) return 1;
  return Math.max(...transactions.map((t) => t.id)) + 1;
}

const app = express();
const categories = new Set<string>([...IN_CATEGORIES, ...OUT_CATEGORIES]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Flow-Access-Key'],
  }),
);
app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=()');
  next();
});
app.use(express.json({ limit: '100kb' }));

function requireAccessKey(req: Request, res: Response, next: NextFunction) {
  if (!accessKey) {
    next();
    return;
  }

  if (req.header('X-Flow-Access-Key') === accessKey) {
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized' });
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

function parseTransaction(input: unknown, fallbackId?: number): Transaction | null {
  if (!input || typeof input !== 'object') return null;
  const body = input as Partial<Transaction>;
  const idCandidate = fallbackId ?? body.id;
  const amountCandidate = body.amount;
  const title = cleanText(body.title, 120);
  const category = cleanText(body.category, 40);
  const who = cleanText(body.who, 120);
  const why = cleanText(body.why, 240);
  const date = cleanText(body.date, 10);
  const method = cleanText(body.method, 80);

  if (
    typeof idCandidate !== 'number' ||
    !Number.isSafeInteger(idCandidate) ||
    idCandidate <= 0
  ) {
    return null;
  }
  if (body.dir !== 'in' && body.dir !== 'out') return null;
  if (
    typeof amountCandidate !== 'number' ||
    !Number.isFinite(amountCandidate) ||
    amountCandidate <= 0 ||
    amountCandidate > 1_000_000_000
  ) {
    return null;
  }
  if (!category || !categories.has(category)) return null;
  if (!title || who === null || why === null || !date || !datePattern.test(date) || method === null) {
    return null;
  }

  return {
    id: idCandidate,
    dir: body.dir,
    amount: amountCandidate,
    category,
    title,
    who,
    why,
    date,
    method,
  };
}

function parseSettings(input: unknown, fallback: Settings): Settings | null {
  if (!input || typeof input !== 'object') return fallback;
  const body = input as Partial<Settings>;
  const openingBalance =
    body.openingBalance === undefined ? fallback.openingBalance : body.openingBalance;
  const showCents = body.showCents === undefined ? fallback.showCents : body.showCents;

  if (!Number.isFinite(openingBalance) || Math.abs(openingBalance) > 1_000_000_000) {
    return null;
  }
  if (typeof showCents !== 'boolean') return null;

  return { openingBalance, showCents };
}

function parseStore(input: unknown, fallback: StoreShape): StoreShape | null {
  if (!input || typeof input !== 'object') return null;
  const body = input as Partial<StoreShape>;
  if (!Array.isArray(body.transactions) || body.transactions.length > 5000) return null;

  const transactions = body.transactions.map((transaction) => parseTransaction(transaction));
  if (transactions.some((transaction) => transaction === null)) return null;

  const settings = parseSettings(body.settings, fallback.settings);
  if (!settings) return null;

  return { transactions: transactions as Transaction[], settings };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, authRequired: Boolean(accessKey) });
});

app.use('/api', requireAccessKey);

app.get('/api/state', (_req, res) => {
  res.json(readStore());
});

app.put('/api/state', (req, res) => {
  const current = readStore();
  const next = parseStore(req.body, current);
  if (!next) return res.status(400).json({ error: 'Invalid state payload' });

  writeStore(next);
  res.json(next);
});

app.get('/api/transactions', (_req, res) => {
  res.json(readStore().transactions);
});

app.post('/api/transactions', (req, res) => {
  const store = readStore();
  const nextTransaction = parseTransaction(req.body, nextId(store.transactions));
  if (!nextTransaction) return res.status(400).json({ error: 'Invalid transaction payload' });

  const next = {
    ...store,
    transactions: [...store.transactions, nextTransaction],
  };
  writeStore(next);
  res.status(201).json(nextTransaction);
});

app.put('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }
  const store = readStore();
  const exists = store.transactions.some((t) => t.id === id);
  if (!exists) return res.status(404).json({ error: 'Transaction not found' });

  const updated = parseTransaction(req.body, id);
  if (!updated) return res.status(400).json({ error: 'Invalid transaction payload' });

  const next = {
    ...store,
    transactions: store.transactions.map((t) => (t.id === id ? updated : t)),
  };
  writeStore(next);
  res.json(next.transactions.find((t) => t.id === id));
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }
  const store = readStore();
  const nextTransactions = store.transactions.filter((t) => t.id !== id);
  if (nextTransactions.length === store.transactions.length) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  writeStore({ ...store, transactions: nextTransactions });
  res.status(204).send();
});

app.get('/api/settings', (_req, res) => {
  res.json(readStore().settings);
});

app.put('/api/settings', (req, res) => {
  const store = readStore();
  const settings = parseSettings(req.body, store.settings);
  if (!settings) return res.status(400).json({ error: 'Invalid settings payload' });

  writeStore({ ...store, settings });
  res.json(settings);
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Request failed:', err.message);
  res.status(400).json({ error: 'Request failed' });
});

app.listen(port, host, () => {
  console.log(`Flow backend running on http://${host}:${port}`);
});
