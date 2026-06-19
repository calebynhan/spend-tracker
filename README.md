# Flow — Money Tracker

A free, local-first full-stack app that tracks where your money comes from and where it goes. No bank connection, no LLM, no cloud costs.

## Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React + Vite + PWA | Mobile UI, voice input, offline cache |
| Backend | Express + SQLite | REST API, persistent storage |
| Storage | `data/flow.db` | Local SQLite database (free) |

The frontend auto-detects the API. When the server is running, data syncs to SQLite. When offline, it falls back to IndexedDB in your browser.

## Features

- **Money flow tracking** — what, when, how, and why for every transaction
- **Dashboard** — totals for investing, necessities, fun, peer transfers (with reasons)
- **Voice input** — free Web Speech API, no AI cost ("Spent 33 dollars on Uber yesterday")
- **Auto-categorization** — rule-based from merchant names
- **PWA** — install on iPhone/Android home screen
- **Pre-loaded data** — all SoFi transactions from April–June 2026 seeded on first launch

## Quick start

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173 (or your LAN IP for phone testing)
- API: http://localhost:3001/api

### Production (single server)

```bash
npm run preview
```

Builds the frontend and serves everything from port 3001.

### Install on phone

1. Run `npm run preview` or deploy to your home network
2. Open `http://<your-computer-ip>:3001` in Safari/Chrome
3. Share → "Add to Home Screen"

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/stats` | Aggregate stats |

## Categories

| Category | What it tracks |
|----------|----------------|
| Income | Payroll, interest, deposits |
| Investing | Schwab, Fidelity transfers |
| Received from People | Venmo/Zelle in |
| Sent to People | Zelle/Venmo out (with reasons) |
| Necessities | Transit, essentials |
| Fun | Uber, dining, entertainment |
| Subscriptions | Google One, Adobe |
| Credit Card | Discover bill payments |

## Adding new transactions

Use the **Add** tab — voice or quick form. Category auto-detects from the merchant name. Tap any transaction in Activity to edit the reason, person, or category.
