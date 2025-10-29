'use server';

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../backend/convex/convex/_generated/api";
import type { Id } from "../../../../../backend/convex/convex/_generated/dataModel";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexHttpClient(convexUrl);

const RAW_TIER_MAP = {
  start: "essencial",
  essencial: "essencial",
  plus: "plus",
  pro: "pro",
} as const;

const TIER_MAP: Record<string, "essencial" | "plus" | "pro"> = Object.fromEntries(
  Object.entries(RAW_TIER_MAP).map(([key, value]) => [key.toLowerCase(), value]),
) as Record<string, "essencial" | "plus" | "pro">;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get("tenantId");
  const tierParam = (searchParams.get("tierKey") ?? "").toLowerCase();
  const onboardingToken = searchParams.get("onboardingToken") ?? undefined;

  if (!tenantId || tenantId.length === 0) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  const tierKey = TIER_MAP[tierParam];
  if (!tierKey) {
    return NextResponse.json({ error: "Invalid tierKey" }, { status: 400 });
  }

  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken && !onboardingToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;
  const successUrl = `${origin}/success`;
  const cancelUrl = `${origin}/cancel`;

  try {
    const result = await convex.action(api.billing.createCheckoutSession, {
      tenantId: tenantId as Id<"condos">,
      tierKey,
      successUrl,
      cancelUrl,
      sessionToken,
      onboardingToken: onboardingToken ?? undefined,
    });

    if (result?.url) {
      return NextResponse.redirect(result.url, { status: 303 });
    }

    return NextResponse.json({ error: "Checkout session unavailable" }, { status: 502 });
  } catch (error) {
    console.error("[landing.checkout] Failed to create checkout session", error);
    return NextResponse.json({ error: "Unable to initiate checkout" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let payload: {
    tenantId?: unknown;
    tierKey?: unknown;
    onboardingToken?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tenantId = typeof payload.tenantId === "string" ? payload.tenantId.trim() : "";
  const tierParam =
    typeof payload.tierKey === "string" ? payload.tierKey.toLowerCase() : "";
  const onboardingToken =
    typeof payload.onboardingToken === "string" ? payload.onboardingToken : undefined;

  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  const tierKey = TIER_MAP[tierParam];
  if (!tierKey) {
    return NextResponse.json({ error: "Invalid tierKey" }, { status: 400 });
  }

  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken && !onboardingToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;
  const successUrl = `${origin}/success`;
  const cancelUrl = `${origin}/cancel`;

  try {
    const result = await convex.action(api.billing.createCheckoutSession, {
      tenantId: tenantId as Id<"condos">,
      tierKey,
      successUrl,
      cancelUrl,
      sessionToken,
      onboardingToken,
    });

    if (result?.url) {
      return NextResponse.json({ url: result.url });
    }

    return NextResponse.json({ error: "Checkout session unavailable" }, { status: 502 });
  } catch (error) {
    console.error("[landing.checkout] Failed to create checkout session", error);
    return NextResponse.json({ error: "Unable to initiate checkout" }, { status: 500 });
  }
}
