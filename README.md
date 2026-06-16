# CSV Insight — Clean Architecture + PostgreSQL

A CSV-analytics demo: log in, upload a CSV, and immediately see it parsed, stored,
and visualized in a dashboard. Same user-facing behavior as the original demo, but
restructured into **pragmatic clean architecture** with a **real PostgreSQL** backend
(Supabase) instead of an in-memory store.

## Layers and the dependency rule

Dependencies point **inward only**. An inner layer never imports an outer one.

```
  app/ (interface)  ──▶  src/composition.ts  ──▶  src/application  ──▶  src/domain
                                │
                                └──▶  src/infrastructure  ──▶  src/application (ports), src/domain
```

| Layer | Path | Responsibility | May import |
| --- | --- | --- | --- |
| **Domain** | `src/domain/` | Pure entities + value objects + rules: `User`, `Dataset`, `DataRow`, `Column`, the CSV `parseCsv` / `sniffTypes` / `buildRecords` logic, and `hashPassword`. | nothing (no `next`, no DB, no framework) |
| **Application** | `src/application/` | Use-cases (`authenticate`, `uploadDataset`, `listDatasets`, `getDatasetView`, `deleteDataset`) and **ports** (`UserRepository`, `DatasetRepository` interfaces in `ports.ts`). | domain + ports only |
| **Infrastructure** | `src/infrastructure/postgres/` | Adapters that implement the ports against PostgreSQL: `client.ts` (postgres.js singleton), `schema.sql`, `PostgresUserRepository`, `PostgresDatasetRepository`. | application (ports) + domain |
| **Interface** | `app/`, `components/` | Next.js server components / server actions / route handlers + React UI. Calls use-cases via the composition root only. | `@/composition`, plus type-only imports from `@/domain` | 

### Composition root

`src/composition.ts` is the **only** module the interface layer reaches for use-cases,
and the **only** place that instantiates infrastructure. It news up the Postgres repos,
wires them into the use-case factories, and exports the ready-to-call use-cases.

### Swapping the persistence adapter

Write a new class implementing `UserRepository` / `DatasetRepository` (from
`src/application/ports.ts`) — e.g. an in-memory or a different database. Then change
only the two `new Postgres*Repository()` lines in `src/composition.ts`. No use-case
and no page changes: every consumer depends on the port, not the adapter.

> Session/cookie handling (`app/lib/session.ts`) is framework-coupled to `next/headers`,
> so it lives in the interface layer, not in domain/application.

## Database (PostgreSQL via Supabase)

- **App runtime** uses the Supabase **transaction pooler** (`:6543`) with postgres.js
  `{ prepare: false }` — required, since that pooler does not support prepared statements.
- **Migrations** use the **session pooler** (`:5432`).

Tables: `users(id, email unique, password_hash, role)`,
`datasets(id, user_id, owner_email, filename, columns jsonb, row_count, created_at)`,
`rows(id, dataset_id → datasets ON DELETE CASCADE, data jsonb)`. The migration is
idempotent (`CREATE TABLE IF NOT EXISTS`, seed via `ON CONFLICT DO NOTHING`) and seeds
`admin@demo.test` with `sha256('demo1234')`.

DB-touching pages/routes are marked `export const dynamic = "force-dynamic"` so the
Vercel build never hits the database at build time.

## Run locally

```bash
pnpm install
# .env.local already contains DATABASE_URL (txn pooler) + MIGRATE_DATABASE_URL (session pooler)
pnpm migrate          # apply schema + seed admin; prints the tables it finds
pnpm dev              # http://localhost:3000
```

## Seeded credentials

```
email:    admin@demo.test
password: demo1234
```

The login form is pre-filled — just click **Sign in**.

## Routes

| Route        | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `/login`     | Credential form; sets the signed httpOnly session cookie  |
| `/upload`    | Drag-and-drop CSV upload with live parse result           |
| `/dashboard` | Stat cards + chart + sortable/paginated table per dataset |
| `/admin`     | Dataset list + delete (admin role only)                   |

## Tests

Playwright acceptance tests cover every acceptance criterion (auth gate, upload parse,
dashboard stats/chart/table, admin delete, edge cases) against the live Postgres DB.

```bash
pnpm exec playwright install chromium   # one-time
pnpm test
```

## Tech stack

- Next.js (App Router) + TypeScript, Tailwind CSS
- Server Actions (login/logout/delete) + a Node.js Route Handler for CSV upload
- PostgreSQL (Supabase) via postgres.js
- Clean architecture: domain / application (use-cases + ports) / infrastructure / interface
- Playwright for behavioral acceptance tests
