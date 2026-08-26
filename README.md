# VedaAI

Monorepo for the VedaAI edtech web app.

Per `specs/00_Technical_requirements.md` there is **no database and no
authentication** — all state lives in memory in the API process and is lost on
restart. That is intentional.

## Stack

| Piece         | Choice                                  |
| ------------- | --------------------------------------- |
| Package man.  | Bun (workspaces)                        |
| Frontend      | Next.js (App Router) + React + Tailwind |
| Backend       | Express, run on the Bun runtime         |
| Language      | TypeScript everywhere, `strict` on      |
| Persistence   | None — in-memory only                   |

## Layout

```
apps/
  api/      @vedaai/api    Express HTTP API (port 4000)
  web/      @vedaai/web    Next.js frontend (port 3000)
packages/
  shared/   @vedaai/shared Types shared by both sides (request/response contract)
specs/                     Product & technical requirements
```

`@vedaai/shared` is consumed as raw TypeScript — there is no build step for it.
Both the API and the web app import from it so a change to a response shape
surfaces as a compile error on the other side.

## Getting started

```bash
bun install
cp .env.example .env     # optional; the defaults below are already baked in
bun run dev              # starts the API and the web app together
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/health

Run one side on its own with `bun run dev:api` or `bun run dev:web`.

## Scripts

Run from the repo root:

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `bun run dev`        | API + web in watch mode                       |
| `bun run build`      | Production build of every workspace           |
| `bun run typecheck`  | `tsc --noEmit` across every workspace         |
| `bun run lint`       | ESLint (web app)                              |
| `bun run format`     | Prettier over the repo                        |
| `bun test`           | Bun test runner (API tests)                   |

## Conventions

- **Backend first.** For each sub-feature the API is built and tested before any
  frontend work starts, as required by the spec.
- **Figma is the source of truth for UI.** Design tokens live in the `@theme`
  block of `apps/web/app/globals.css`; the current values are placeholders to be
  replaced with the Figma variables. Tailwind v4 is configured in CSS, so there
  is no `tailwind.config.ts`.
- **One response envelope.** Every endpoint returns `{ ok: true, data }` or
  `{ ok: false, error: { code, message } }` (see `packages/shared/src/http.ts`).
  Route handlers throw `HttpError`; the central error handler does the rest.

## Configuration

All optional — see `.env.example`.

| Variable              | Default                 | Used by |
| --------------------- | ----------------------- | ------- |
| `API_PORT`            | `4000`                  | api     |
| `API_CORS_ORIGIN`     | `http://localhost:3000` | api     |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | web     |
