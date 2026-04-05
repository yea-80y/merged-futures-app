# Merged Futures 8 — Conference Companion App

A prototype PWA for the Merged Futures 8 conference (Digital Northants 8th Annual Innovation Showcase, 26 June 2026, University of Northampton).

This is a **working prototype** built to explore what a decentralized conference companion app could look like. It's being proposed to the event organizers — not yet confirmed for the event.

## What it does

- Browse the full event agenda across 5 tracks
- Reserve talks and get a POD (Proof of Attendance) stored on Swarm
- Personal schedule with time-conflict detection
- Per-talk discussion threads
- User profiles with avatar upload
- Organiser dashboard showing reservation counts
- Installable as a PWA on mobile

## Tech

- **Frontend**: Svelte 5, Vite, TypeScript, Tailwind CSS v4
- **Backend**: Hono.js on Node
- **Storage**: Swarm decentralized storage (no traditional database)
- **Auth**: Passkey + Web3 wallet with EIP-712 session delegation

All data (reservations, profiles, forum posts, PODs) is stored on Swarm feeds. The frontend is also hosted on Swarm.

## Running locally

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Backend (needs .env with Swarm config)
cd backend
npm install
npm run dev        # http://localhost:3002
```

## Structure

```
frontend/   Svelte 5 PWA
backend/    Hono.js API server
shared/     Shared TypeScript types
```
