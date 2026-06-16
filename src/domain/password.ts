// Password hashing rule. Uses node:crypto only (a runtime primitive, not a
// framework) so it stays a pure domain concern: "a password matches if its
// sha256 hex equals the stored hash". Kept identical to the original scheme so
// the seeded admin@demo.test / demo1234 credentials still work.

import crypto from "node:crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function passwordMatches(password: string, passwordHash: string): boolean {
  return hashPassword(password) === passwordHash;
}
