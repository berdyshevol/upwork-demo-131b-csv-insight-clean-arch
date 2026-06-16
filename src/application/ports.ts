// PORTS — the interfaces the application layer needs from the outside world.
// Use-cases depend on these abstractions, never on a concrete database. An
// adapter in src/infrastructure implements them; the composition root wires
// the chosen adapter in. Swap Postgres for anything else by writing new
// implementations of these two interfaces — no use-case changes.

import type { User, Dataset, DataRow, Column } from "@/domain";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}

export interface NewDatasetInput {
  userId: string;
  ownerEmail: string;
  filename: string;
  columns: Column[];
  records: Record<string, string>[];
}

export interface DatasetRepository {
  create(input: NewDatasetInput): Promise<Dataset>;
  /** All datasets, newest first. */
  listAll(): Promise<Dataset[]>;
  /** A single user's datasets, newest first. */
  listForUser(userId: string): Promise<Dataset[]>;
  findById(datasetId: string): Promise<Dataset | null>;
  getRows(datasetId: string): Promise<DataRow[]>;
  /** Returns true if a dataset was deleted, false if it did not exist. */
  delete(datasetId: string): Promise<boolean>;
}
