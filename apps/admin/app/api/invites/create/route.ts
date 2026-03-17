'use server';

import { NextResponse } from "next/server";
import { api, Id } from "../../../../src/lib/convexGenerated";
import { createServerConvexClient } from "../../../../src/lib/serverConvex";
import { getAdminSessionCookie } from "../../../../src/lib/serverSession";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL!;

if (!adminUrl) {
  throw new Error("NEXT_PUBLIC_ADMIN_URL is not configured");
}

type InvitePayload = {
  condoId?: string;
  email?: string;
  name?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(request: Request) {
  let payload: InvitePayload;
  try {
    payload = (await request.json()) as InvitePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to send invite" },
      { status: 400 },
    );
  }

  const condoId = payload.condoId as Id<"condos"> | undefined;
  const email = payload.email?.trim() ?? "";
  const name = payload.name?.trim() ?? "";

  if (!condoId || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Unable to send invite" },
      { status: 400 },
    );
  }

  const sessionToken = getAdminSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { ok: false, error: "Unable to send invite" },
      { status: 401 },
    );
  }

  try {
    const convex = createServerConvexClient();
    await convex.action(api.invites.createAndEmail, {
      token: sessionToken,
      condoId,
      email,
      name: name || undefined,
      acceptBaseUrl: `${adminUrl.replace(/\/$/, "")}/invite/accept`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invite creation failed", error);
    return NextResponse.json(
      { ok: false, error: "Unable to send invite" },
      { status: 429 },
    );
  }
}
