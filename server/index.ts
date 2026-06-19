import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Transaction } from '../src/types.ts';
import { createTransaction } from '../src/lib/categorize.ts';
import {
  deleteTransaction,
  getAllTransactions,
  getStats,
  getTransaction,
  insertTransaction,
  updateTransaction,
} from './db.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'flow-money-tracker' });
});

app.get('/api/transactions', (_req, res) => {
  res.json(getAllTransactions());
});

app.get('/api/transactions/:id', (req, res) => {
  const tx = getTransaction(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Not found' });
  res.json(tx);
});

app.post('/api/transactions', (req, res) => {
  const body = req.body as Partial<Transaction>;
  if (!body.description || !body.amount || !body.direction || !body.account || !body.date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx = createTransaction({
    id: body.id ?? crypto.randomUUID(),
    date: body.date,
    description: body.description,
    amount: Number(body.amount),
    direction: body.direction,
    account: body.account,
    category: body.category,
    source: body.source,
    reason: body.reason,
    method: body.method,
    person: body.person,
    notes: body.notes,
  });

  insertTransaction(tx);
  res.status(201).json(tx);
});

app.put('/api/transactions/:id', (req, res) => {
  const existing = getTransaction(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const body = req.body as Partial<Transaction>;
  const tx = createTransaction({
    ...existing,
    ...body,
    id: req.params.id,
    amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
  });

  updateTransaction(tx);
  res.json(tx);
});

app.delete('/api/transactions/:id', (req, res) => {
  const deleted = deleteTransaction(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

app.get('/api/stats', (_req, res) => {
  res.json(getStats());
});

const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Flow server running at http://localhost:${PORT}`);
  if (existsSync(distPath)) {
    console.log(`Serving frontend from ${distPath}`);
  }
});
