// Postgres adapter implementing the UserRepository port.

import type { User, Role } from "@/domain";
import type { UserRepository } from "@/application";
import { sql } from "./client";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as Role,
  };
}

export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const rows = await sql<UserRow[]>`
      SELECT id, email, password_hash, role
      FROM users
      WHERE lower(email) = lower(${email})
      LIMIT 1
    `;
    const row = rows[0];
    return row ? toUser(row) : null;
  }
}
