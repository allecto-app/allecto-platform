'use server';

import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, buildAdminSessionCookieOptions } from "../../../../src/lib/serverSession";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type SessionPayload = {
  token?: unknown;
  expiresAt?: unknown;
};

function defaultExpiry() {
  return new Date(Date.now() + ONE_DAY_MS);
}

function isValidToken(token: unknown): token is string {
  return typeof token === "string" && token.length >= 32;
}

function parseExpiresAt(expiresAt: unknown): Date {
  if (typeof expiresAt === "number") {
    const date = new Date(expiresAt);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  if (typeof expiresAt === "string") {
    const parsed = Number(expiresAt);
    if (!Number.isNaN(parsed)) {
      const date = new Date(parsed);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    const date = new Date(expiresAt);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return defaultExpiry();
}

export async function POST(request: Request) {
  let payload: SessionPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const token = payload.token;
  if (!isValidToken(token)) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  }

  const expiresAt = parseExpiresAt(payload.expiresAt);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...buildAdminSessionCookieOptions(expiresAt),
    value: token,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...buildAdminSessionCookieOptions(new Date(0)),
    value: "",
  });
  return response;
}
