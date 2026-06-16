// Postgres adapter implementing the DatasetRepository port. Owns SQL, id
// generation and row<->entity mapping. The application layer never sees any of it.

import crypto from "node:crypto";
import type { Dataset, DataRow, Column } from "@/domain";
import type { DatasetRepository, NewDatasetInput } from "@/application";
import { sql } from "./client";

function id(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

// postgres.js's `.json()` helper types its argument as an object-shaped
// JSONValue, which rejects plain arrays (Column[]). Our values are valid JSON;
// this thin wrapper serializes them through that helper with the cast.
type JsonArg = Parameters<typeof sql.json>[0];
function jsonb(value: unknown) {
  return sql.json(value as JsonArg);
}

interface DatasetRow {
  id: string;
  user_id: string;
  owner_email: string;
  filename: string;
  columns: Column[];
  row_count: number;
  created_at: Date;
}

function toDataset(row: DatasetRow): Dataset {
  return {
    id: row.id,
    userId: row.user_id,
    ownerEmail: row.owner_email,
    filename: row.filename,
    columns: row.columns,
    rowCount: row.row_count,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresDatasetRepository implements DatasetRepository {
  async create(input: NewDatasetInput): Promise<Dataset> {
    const datasetId = id("ds");
    const rowCount = input.records.length;

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO datasets (id, user_id, owner_email, filename, columns, row_count)
        VALUES (
          ${datasetId},
          ${input.userId},
          ${input.ownerEmail},
          ${input.filename},
          ${jsonb(input.columns)},
          ${rowCount}
        )
      `;

      if (input.records.length > 0) {
        const rowValues = input.records.map((record) => ({
          id: id("row"),
          dataset_id: datasetId,
          data: jsonb(record),
        }));
        await tx`INSERT INTO rows ${tx(rowValues, "id", "dataset_id", "data")}`;
      }
    });

    const created = await this.findById(datasetId);
    // create() just inserted it; this is non-null by construction.
    return created as Dataset;
  }

  async listAll(): Promise<Dataset[]> {
    const rows = await sql<DatasetRow[]>`
      SELECT id, user_id, owner_email, filename, columns, row_count, created_at
      FROM datasets
      ORDER BY created_at DESC, id DESC
    `;
    return rows.map(toDataset);
  }

  async listForUser(userId: string): Promise<Dataset[]> {
    const rows = await sql<DatasetRow[]>`
      SELECT id, user_id, owner_email, filename, columns, row_count, created_at
      FROM datasets
      WHERE user_id = ${userId}
      ORDER BY created_at DESC, id DESC
    `;
    return rows.map(toDataset);
  }

  async findById(datasetId: string): Promise<Dataset | null> {
    const rows = await sql<DatasetRow[]>`
      SELECT id, user_id, owner_email, filename, columns, row_count, created_at
      FROM datasets
      WHERE id = ${datasetId}
      LIMIT 1
    `;
    const row = rows[0];
    return row ? toDataset(row) : null;
  }

  async getRows(datasetId: string): Promise<DataRow[]> {
    const rows = await sql<
      { id: string; dataset_id: string; data: Record<string, string> }[]
    >`
      SELECT id, dataset_id, data
      FROM rows
      WHERE dataset_id = ${datasetId}
    `;
    return rows.map((r) => ({
      id: r.id,
      datasetId: r.dataset_id,
      data: r.data,
    }));
  }

  async delete(datasetId: string): Promise<boolean> {
    // rows are removed by the ON DELETE CASCADE foreign key.
    const result = await sql`DELETE FROM datasets WHERE id = ${datasetId}`;
    return result.count > 0;
  }
}
