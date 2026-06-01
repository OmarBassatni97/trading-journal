@AGENTS.md

# Trading Journal — Project Context

## Overview

A personal trading journal to log, review, and analyze trades. Built as a monorepo with a Next.js frontend and an Express + Prisma backend.

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend  | Express 5, TypeScript 6, ts-node      |
| Database | SQLite via Prisma ORM                 |
| Language | TypeScript throughout                 |

## Project Structure

```
trading-journal/
├── client/                  # Next.js frontend (this folder)
│   ├── src/
│   │   ├── app/             # App Router layout and root page
│   │   ├── components/      # TradeForm, History, Stats
│   │   ├── lib/api.ts       # fetch wrappers (getTrades, createTrade, deleteTrade)
│   │   └── types/trade.ts   # Trade and NewTrade interfaces
│   └── ...
└── server/                  # Express backend
    ├── src/
    │   ├── index.ts         # App entry, CORS, routes mount
    │   └── routes/trades.ts # GET / POST / DELETE /api/trades
    └── prisma/
        └── schema.prisma    # Trade model (SQLite)
```

## Data Model (`Trade`)

| Field      | Type     | Notes                               |
| ---------- | -------- | ----------------------------------- |
| id         | Int      | Auto-increment PK                   |
| date       | String   |                                     |
| asset      | String   | Default: "US100"                    |
| bias       | String   | "bull" \| "bear" \| "neutral"       |
| biasReason | String?  |                                     |
| entry      | Float?   |                                     |
| sl         | Float?   | Stop loss                           |
| tp         | Float?   | Take profit                         |
| time       | String?  |                                     |
| rr         | String?  | Risk/reward label                   |
| outcome    | String   | "win" \| "loss" \| "be" \| "missed" |
| good       | String?  | What went well                      |
| improve    | String?  | What to improve                     |
| checkCount | Int      | Default 0                           |
| checks     | String   | JSON-serialised boolean array       |
| createdAt  | DateTime | Auto                                |

## API Endpoints

- `GET    /api/trades` — fetch all trades (desc by createdAt)
- `POST   /api/trades` — create a trade (`date`, `bias`, `outcome` required)
- `DELETE /api/trades/:id` — delete a trade by id

## Environment Variables

**server/.env**

```
DATABASE_URL="file:./dev.db"
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

**client/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Running Locally

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Frontend: http://localhost:3000  
API: http://localhost:5000

## Key Conventions

- `checks` is stored as a JSON string in SQLite and parsed to `boolean[]` before sending to the client.
- All API calls live in `client/src/lib/api.ts`; components never call `fetch` directly.
- The frontend uses the Next.js App Router (no `pages/` directory).
- Tailwind CSS v4 is configured via `@tailwindcss/postcss` (no `tailwind.config.js`).
