# Trading Journal

A personal trading journal application to track, analyze, and improve trading performance.

## Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Express.js (Node.js)

## Features

- Log trades with entry/exit details (symbol, price, quantity, date, direction)
- Track P&L per trade and overall portfolio performance
- Add notes and tags to trades for review
- View trade history with filtering and sorting
- Performance dashboard with charts and statistics (win rate, avg R:R, drawdown, etc.)
- Journal entries tied to individual trades or trading sessions

## Project Structure

```
trading-journal/
├── client/          # Next.js frontend
│   ├── app/
│   ├── components/
│   └── ...
├── server/          # Express.js backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- A running database (PostgreSQL recommended)

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the App

```bash
# Start the backend (from /server)
npm run dev

# Start the frontend (from /client)
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:5000`.

## Environment Variables

Create a `.env` file in both `client/` and `server/` directories. See `.env.example` in each for required variables.

## License

MIT

# Terminal 1 — server

cd server && npx ts-node src/index.ts

# Terminal 2 — client

cd client && npm run dev
