
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../src/lib/convexGenerated";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

export const convex = new ConvexHttpClient(convexUrl);

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export function mapConvexError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  const lowered = message.toLowerCase();

  if (lowered.includes("invalid") || lowered.includes("not found") || lowered.includes("required")) {
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
  if (lowered.includes("unauthorized") || lowered.includes("forbidden") || lowered.includes("expired")) {
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  return NextResponse.json({ ok: false, error: message }, { status: 500 });
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
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function callIssueToken(apiKey: string, apiSecret: string) {
  return convex.mutation(api.externalApi.issueToken, { apiKey, apiSecret });
}
