// Run the schema migration against a Postgres database.
//
// Use the SESSION pooler URL (port 5432) for migrations — DDL + multi-statement
// scripts are happier there than on the transaction pooler. Set it via
// MIGRATE_DATABASE_URL, falling back to DATABASE_URL.
//
//   MIGRATE_DATABASE_URL="postgresql://...:5432/postgres" npm run migrate

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Set MIGRATE_DATABASE_URL (session pooler, :5432) or DATABASE_URL.",
    );
  }

  const schemaPath = join(
    __dirname,
    "..",
    "src",
    "infrastructure",
    "postgres",
    "schema.sql",
  );
  const schema = readFileSync(schemaPath, "utf-8");

  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    console.log("Applying schema…");
    await sql.unsafe(schema);

    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'datasets', 'rows')
      ORDER BY table_name
    `;
    console.log(
      "Tables present:",
      tables.map((t) => t.table_name).join(", ") || "(none)",
    );

    const admins = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM users WHERE email = 'admin@demo.test'
    `;
    console.log(`Seeded admin rows: ${admins[0]?.count ?? "0"}`);
    console.log("Migration complete.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
