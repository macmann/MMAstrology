import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, verifySessionToken } from "@/lib/session-token";

export { AUTH_COOKIE_NAME, signSessionToken, verifySessionToken } from "@/lib/session-token";

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
