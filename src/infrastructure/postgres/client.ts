// postgres.js client singleton. Lives on globalThis so dev hot-reload and warm
// serverless lambdas reuse one pool instead of leaking connections.
//
// IMPORTANT: the app connects through Neon's POOLED endpoint (the `-pooler`
// host), a PgBouncer in transaction mode, which does NOT support prepared
// statements — hence `{ prepare: false }`. The migration script uses the
// direct (non-pooled) endpoint instead.

import postgres, { type Sql } from "postgres";

const globalRef = globalThis as unknown as { __sql?: Sql };

function create(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  return postgres(url, {
    prepare: false,
    // Keep the pool small — serverless functions are short-lived.
    max: 5,
    idle_timeout: 20,
  });
}

export const sql: Sql = globalRef.__sql ?? (globalRef.__sql = create());
