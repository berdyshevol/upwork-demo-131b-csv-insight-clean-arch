"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "@/composition";
import { createToken, SESSION_COOKIE } from "@/app/lib/session";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await authenticate(email, password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const jar = await cookies();
  jar.set(
    SESSION_COOKIE,
    createToken({ userId: user.id, email: user.email, role: user.role }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
    },
  );

  redirect("/dashboard");
}
