'use server';

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexHttpClient(convexUrl);

type SignupPayload = {
  tierKey?: unknown;
  condoName?: unknown;
  subdomain?: unknown;
  adminName?: unknown;
  adminEmail?: unknown;
  adminPhone?: unknown;
};

const TIER_MAP: Record<string, "avulso" | "essencial" | "gestao" | "administradora"> = {
  avulso: "avulso",
  essencial: "essencial",
  start: "essencial",
  gestao: "gestao",
  administradora: "administradora",
};

function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: SignupPayload;
  try {
    payload = (await request.json()) as SignupPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tierKeyParam = coerceString(payload.tierKey);
  const tierKey = TIER_MAP[tierKeyParam];
  if (!tierKey) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const condoName = coerceString(payload.condoName);
  const subdomain = coerceString(payload.subdomain);
  const adminName = coerceString(payload.adminName);
  const adminEmail = coerceString(payload.adminEmail);
  const adminPhone = coerceString(payload.adminPhone);

  if (!condoName || !subdomain || !adminName || !adminEmail) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    // Runtime string references are required because this app does not import Convex-generated bindings.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (convex as any).mutation("onboarding:startTenantSignup", {
      tierKey,
      condoName,
      subdomain,
      adminName,
      adminEmail,
      adminPhone: adminPhone || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[landing.onboarding] Failed to start signup", error);
    const message = error instanceof Error ? error.message : "signup_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
