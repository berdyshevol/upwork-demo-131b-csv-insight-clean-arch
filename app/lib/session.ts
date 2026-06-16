// Interface-layer session helper. Framework-coupled (next/headers cookies),
// so it lives with the interface (app/), NOT in domain/application. It maps an
// authenticated user to a signed, httpOnly cookie and back.

import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { Role } from "@/domain";

const SECRET = "csv-insight-pilot-demo-signing-secret";
export const SESSION_COOKIE = "csv_session";

export interface Session {
  userId: string;
  email: string;
  role: Role;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createToken(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value);
}
