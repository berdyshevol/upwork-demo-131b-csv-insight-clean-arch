// Domain entities + value objects. PURE: no imports of next, db, or any framework.
// These are the nouns of the business: who can log in, what a dataset is, and the
// shape of a parsed row. Everything else (use-cases, adapters, UI) depends on these.

export type Role = "user" | "admin";

export type ColType = "number" | "string";

/** Value object: one parsed CSV column with its sniffed type. */
export interface Column {
  name: string;
  type: ColType;
}

/** A person who can authenticate. `passwordHash` is sha256(password) hex. */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
}

/** Metadata for one uploaded CSV file. Rows live in DataRow. */
export interface Dataset {
  id: string;
  userId: string;
  ownerEmail: string;
  filename: string;
  columns: Column[];
  rowCount: number;
  createdAt: string;
}

/** A single record of a dataset, keyed by header name. */
export interface DataRow {
  id: string;
  datasetId: string;
  data: Record<string, string>;
}
