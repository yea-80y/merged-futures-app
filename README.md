# Merged Futures 8 — Conference Companion PWA

A decentralised conference companion app for **Merged Futures 8** (Digital Northants 8th Annual Innovation Showcase, 26 June 2026, University of Northampton).

Built as a working prototype to explore what a fully decentralised event platform looks like — no traditional database, no centralised hosting. All data lives on [Swarm](https://ethswarm.org) and the frontend is served from Swarm too.

> **Status:** Prototype — being proposed to the event organisers. Not yet confirmed for the event.

## Demo

[View the live prototype](https://gateway.woco-net.com/bzz/ac0d9cdccdaab0528bb2dd03172b16b47dea72c8a6890fb82e1cf63fb71d624d/)

*Open in your regular browser (mobile or desktop) — in-app browsers (e.g. LinkedIn, Twitter) do not support passkeys.*

## Features

- **Agenda** — Browse the full event schedule across 5 tracks with talk details and speaker info
- **Talk Reservations** — Reserve your spot at talks and receive a POD (Proof of Attendance) stored on Swarm
- **Personal Schedule** — View your reserved talks with automatic time-conflict detection
- **Discussion Forum** — Per-talk discussion threads for pre/post-event conversation
- **User Profiles** — Create a profile with avatar upload (stored on Swarm)
- **Organiser Dashboard** — View reservation counts and attendance data across all talks
- **PWA** — Installable on mobile for an app-like experience

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Svelte 5, Vite, TypeScript, Tailwind CSS v4, vite-plugin-pwa |
| Backend | Hono.js, Node.js, ethers.js |
| Storage | Swarm decentralised storage (feeds + bytes) |
| Auth | Passkey + Web3 wallet with EIP-712 session delegation |

All data — reservations, profiles, forum posts, PODs — is stored on Swarm feeds. There is no traditional database. The frontend is also hosted on Swarm via a content hash.

## Project Structure

```
frontend/          Svelte 5 PWA (port 5173 in dev)
  src/
    lib/
      auth/        Passkey + wallet authentication
      api/         Backend API client functions
      components/  Reusable UI components
      data/        Stores (router, reservations, profile, forum) and agenda data
      pages/       Page components (Home, Agenda, Schedule, Forum, Profile, etc.)
      shared/      Shared TypeScript types
backend/           Hono.js API server (port 3002)
  src/
    routes/        API route handlers
shared/            Reference copy of shared types
scripts/           Deployment scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### Backend

The backend requires a `.env` file with Swarm configuration. Copy the example and fill in your values:

```bash
cd backend
cp .env.example .env
# Edit .env with your Swarm gateway URL, postage batch ID, and feed private key
npm install
npm run dev
```

The API server runs at `http://localhost:3002`.

### Environment Variables

**Frontend** (`frontend/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g. `http://localhost:3002`) |

**Backend** (`backend/.env`):

| Variable | Description |
|----------|-------------|
| `BEE_URL` | Swarm gateway URL |
| `POSTAGE_BATCH_ID` | Swarm postage batch for uploads |
| `FEED_PRIVATE_KEY` | Private key for Swarm feed writes |
| `PORT` | Server port (default: 3002) |
| `ALLOWED_HOSTS` | Comma-separated list of allowed CORS origins |

## How It Works

1. **Authentication** — Users authenticate via passkey (WebAuthn) which creates a session wallet. An EIP-712 signature delegates authority from the user's parent wallet to the session, enabling seamless signing without repeated prompts.

2. **Reservations** — When a user reserves a talk, the backend writes a POD to a Swarm feed scoped to their wallet address. Reservations are stored locally per account and synced from Swarm on new devices.

3. **Storage** — All persistent data (profiles, forum posts, reservation counts) is written to Swarm feeds using the backend's feed key. The backend acts as a relay — it signs and uploads data to Swarm on behalf of users.

4. **Hosting** — The built frontend is uploaded to Swarm and pinned via a feed, producing a content-addressed URL. Hash-based routing ensures deep links work without a traditional server.

## Scripts

| Command | Description |
|---------|-------------|
| `cd frontend && npm run dev` | Start frontend dev server |
| `cd frontend && npm run build` | Build frontend for production |
| `cd frontend && npm run check` | Run Svelte and TypeScript checks |
| `cd backend && npm run dev` | Start backend dev server (with hot reload) |
| `cd backend && npm run build` | Compile backend TypeScript |
| `cd backend && npm run start` | Start backend in production mode |

## License

This project is not yet licensed. All rights reserved.
