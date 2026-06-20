# Flow — Money Tracker

A personal money-flow tracker with a refined "private bank" aesthetic. It works as a PWA, looks good on phone and desktop, and now includes a local backend for durable storage.

## Stack

- **Vite + React + TypeScript** — installable PWA
- **Express** — local backend API
- **JSON file store** — persisted at `data/store.json`
- **localStorage fallback** — browser cache when backend is unavailable
- **Web Speech API** — voice input, no LLM or paid APIs

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 (use your LAN IP on phone). The API runs at http://localhost:3001 and Vite proxies `/api`.

By default, the backend binds to `127.0.0.1` only. That keeps your financial data private on your computer.

### Secure phone access on your Wi-Fi

To use the app from your phone while your computer hosts the backend:

1. Create a local env file:

```bash
cp .env.example .env
```

2. Set `HOST=0.0.0.0`, set `FLOW_ACCESS_KEY` to a long random value, and include both your computer LAN origins:

```bash
HOST=0.0.0.0
FLOW_ACCESS_KEY=<your-long-random-key>
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.25:5173,http://192.168.1.25:3001
```

Replace `192.168.1.25` with your computer's Wi-Fi IP address. When the phone opens the app, it will ask for the access key once per browser session.

### Production-style local run

```bash
npm run preview
```

This builds the PWA and serves it from the Express backend.

### Install on phone

1. Open in Safari (iOS) or Chrome (Android)
2. Share → **Add to Home Screen**

## Screens

| Tab | Screen |
|-----|--------|
| Flow | Balance, in/out split, allocation bar, recent 3 |
| Activity | Full feed with All/In/Out filters |
| + (FAB) | Add transaction with voice or form |
| Buckets | Out-category cards with share bars |
| Trends | Placeholder |

Detail screens: category drill-down (reason pills), transaction detail (edit/delete).

## Voice examples

- "Spent two hundred dollars sent to Mom for birthday gift"
- "Received fifty from Sam for dinner split"
- "Invested eight hundred to Fidelity for monthly investing"

## Reset data

Clear localStorage keys `mf_txns`, `mf_settings`, `mf_seeded` in browser devtools and delete `data/store.json` to re-seed everything.

## API

- `GET /api/health`
- `GET /api/state`
- `PUT /api/state`
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/settings`
- `PUT /api/settings`

## Security Defaults

- Backend listens on `127.0.0.1` unless you explicitly set `HOST`.
- Binding to a non-localhost host requires `FLOW_ACCESS_KEY`.
- CORS is restricted to `ALLOWED_ORIGINS`.
- API requests with a configured access key must send `X-Flow-Access-Key`.
- Request bodies are limited to `100kb`.
- Transactions, settings, and full-state updates are validated before writing `data/store.json`.
- Static production responses include basic security headers and a CSP.
