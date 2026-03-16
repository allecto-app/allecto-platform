
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../src/lib/convexGenerated";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

export const convex = new ConvexHttpClient(convexUrl);

const MAX_JSON_BYTES = 64 * 1024;

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function tooLarge(message = "Payload too large") {
  return NextResponse.json({ ok: false, error: message }, { status: 413 });
}

export function clampLimit(value: number | undefined, fallback = 25, max = 100) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(value as number)));
}

export function clampPage(value: number | undefined, fallback = 1) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value as number));
}

export function parseOptionalNumber(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function parseBoolean(raw: string | null | undefined, fallback = false) {
  if (!raw) return fallback;
  const lowered = raw.toLowerCase().trim();
  if (lowered === "1" || lowered === "true" || lowered === "yes") return true;
  if (lowered === "0" || lowered === "false" || lowered === "no") return false;
  return fallback;
}

export function parseClientIp(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return undefined;
}

export function mapConvexError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";

  if (message.startsWith("EXT_VALIDATION_")) {
    return badRequest("Invalid request payload");
  }
  if (message.startsWith("EXT_NOT_FOUND_")) {
    return NextResponse.json({ ok: false, error: "Resource not found" }, { status: 404 });
  }
  if (message.startsWith("EXT_FORBIDDEN_")) {
    return forbidden("Insufficient permissions for this operation");
  }
  if (message.startsWith("EXT_AUTH_")) {
    return unauthorized("Authentication failed");
  }
  if (message === "FORBIDDEN") {
    return forbidden("Insufficient permissions for this operation");
  }
  if (message === "UNAUTHENTICATED") {
    return unauthorized("Authentication required");
  }

  return NextResponse.json({ ok: false, error: "Request failed" }, { status: 500 });
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token.trim();
}

export async function requireAccessToken(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: unauthorized("Missing bearer token") } as const;
  }
  return { token } as const;
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    const raw = await request.text();
    if (raw.length > MAX_JSON_BYTES) {
      return null;
    }
    if (!raw.trim()) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isSafeText(value: string | undefined, max = 200) {
  if (value === undefined) return true;
  return value.trim().length <= max;
}

export async function callIssueToken(apiKey: string, apiSecret: string, clientIp?: string) {
  return convex.mutation(api.externalApi.issueToken, { apiKey, apiSecret, clientIp });
}
