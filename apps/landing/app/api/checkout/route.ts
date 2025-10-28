'use server';

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexHttpClient(convexUrl);

const TIER_MAP: Record<string, "essencial" | "plus" | "pro"> = {
  start: "essencial",
  essencial: "essencial",
  plus: "plus",
  pro: "pro",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tenantId = searchParams.get("tenantId");
  const tierParam = searchParams.get("tierKey") ?? "";

  if (!tenantId || tenantId.length === 0) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  const tierKey = TIER_MAP[tierParam];
  if (!tierKey) {
    return NextResponse.json({ error: "Invalid tierKey" }, { status: 400 });
  }

  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;
  const successUrl = `${origin}/success`;
  const cancelUrl = `${origin}/cancel`;

  try {
    const result = await convex.action("billing:createCheckoutSession", {
      tenantId,
      tierKey,
      successUrl,
      cancelUrl,
      sessionToken,
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
