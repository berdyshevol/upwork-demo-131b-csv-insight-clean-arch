// Use-case: verify a user's credentials. Depends on the domain (password rule)
// and a UserRepository port — never on a concrete DB.

import { passwordMatches, type User } from "@/domain";
import type { UserRepository } from "./ports";

export function makeAuthenticate(users: UserRepository) {
  return async function authenticate(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await users.findByEmail(email.trim().toLowerCase());
    if (!user) return null;
    return passwordMatches(password, user.passwordHash) ? user : null;
  };
}

export type Authenticate = ReturnType<typeof makeAuthenticate>;
