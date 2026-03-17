import "server-only";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "allecto_admin";
const ONE_DAY_SECONDS = 24 * 60 * 60;

export function getAdminSessionCookie() {
  return cookies().get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export function buildAdminSessionCookieOptions(expiresAt?: Date) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: ADMIN_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    expires: expiresAt,
    maxAge: expiresAt ? undefined : ONE_DAY_SECONDS,
  };
}
