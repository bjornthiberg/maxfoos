# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MaxFoos Manager — a foosball (table football) league tracker for a fixed roster of 10 players. Swedish-language UI. Two independent npm projects in one repo: a Vite/React frontend at the root, and an Express/JSON-file backend in `backend/`.

## Commands

Run from the repo root unless noted.

```bash
npm run dev            # start frontend dev server (Vite, http://localhost:5173)
npm run backend:dev    # start backend with --watch (http://localhost:3001)
npm run backend        # start backend without watch

npm run build           # tsc -b && vite build (type-checks, then bundles to dist/)
npm run lint             # eslint .
npm run preview          # preview the production build locally

npm run deploy           # build, then gh-pages -d dist (publishes to maxfoos.se via GitHub Pages)
```

There is no test suite or test runner configured (`test/data.json` is just sample backend data, not a test spec). There's no separate lint/build command for the backend — it's plain Node with no build step.

To run the backend directly:
```bash
cd backend && npm start     # node src/server.js
cd backend && npm run dev   # node --watch src/server.js
```

## Architecture

**Frontend** (`src/`): React 18 + TypeScript + Vite, routed with `react-router-dom`. Two routes only: `/` (`pages/Home.tsx`) and `/admin` (`pages/Admin.tsx`), wired up in `App.tsx`.

- `src/services/api.ts` is the single point of contact with the backend — all types (`Player`, `Game`, `Team`, `NewGameData`) and all HTTP calls live here. Nothing else should call `fetch` directly. Base URL comes from `VITE_API_BASE_URL` (see `.env.development` / `.env.production`).
- All app state is fetched fresh via `useEffect` + `useState` in the page components (`Home.tsx`, `Admin.tsx`) — no global state management or client-side cache. `loadData()` re-fetches players/games/stats after every mutation.
- `Home.tsx` composes the read-only views: `PlayerTable` (points/goal-diff standings from the backend's `/api/stats`), `EloTable` (ELO rating computed client-side, see below), `GameList` (recent games), `QuartetGameFinder` (given 4 players, enumerates the 3 possible 2v2 team splits and shows how many times each has been played), and `HeadToHead` (win/loss record between two chosen players).
- `Admin.tsx` is password-gated (password checked against the backend, then reused as a bearer for mutating calls — see Security notes) and hosts `AddGameForm` plus a deletable `GameList`.
- **ELO is entirely client-side**, recomputed from scratch on every render in `EloTable.tsx` (`calculateElo`): all players start at 1000, K-factor 32, games processed in chronological order. The backend has no concept of ELO — it only stores raw game results. If you change ELO logic, there's no persistence/migration to worry about since nothing is stored.
- Team/player equality checks throughout (`QuartetGameFinder`, `HeadToHead`) compare players by name string, not id — player identity is just the string in `data.players`.

**Backend** (`backend/src/server.js`): a single-file Express app, no database — state is one JSON blob (`data.json`) read into memory at startup and rewritten on every mutation via `saveData()`. There is no ORM, no migrations, and no schema validation library; all input validation in the route handlers is manual (see `POST /api/games` for the pattern: check required fields, check 4 unique known players, check score sanity, check winner matches the score).

- `DATA_DIRECTORY` env var controls where `data.json` lives (defaults to the backend source dir); on Render/production this points at a mounted volume outside the repo.
- `ADMIN_PASSWORD` env var (falls back to a hardcoded default) gates all mutating routes (`POST /api/games`, `DELETE /api/games/:id`) and `POST /api/admin/verify`. The password is sent from the client as a plain string per-request and re-verified server-side each time — the frontend does not obtain or store a token/session.
- CORS origins are hardcoded in `server.js` to localhost:5173 and the maxfoos.se domain (with/without `www`, http/https) — add new origins there if the deploy target changes.
- Stats (points, goal difference, games played) are computed on-demand in `GET /api/stats` by iterating all games — not stored per-player.

**Data model**: a `Game` has `team1`/`team2` (each `{player1, player2}`), a `winner` (`"team1" | "team2"`), a `score` (`{team1, team2}` as numbers), and a server-assigned `id`/`timestamp`. Players are plain strings from a fixed roster array (`data.players`) — there is no player-add endpoint; the roster is seeded once in `initData` in `server.js`.

## Deployment

Frontend deploys to GitHub Pages at the custom domain `maxfoos.se` (see `public/CNAME`, `npm run deploy`). Backend deploys separately (env vars reference Render, e.g. `VITE_API_BASE_URL=https://maxfoos.onrender.com/api` in `.env.production`) with a persistent volume for `data.json`. It is deployed manually.