'use server';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api, Id } from "../../../../src/lib/convexGenerated";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL!;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

if (!adminUrl) {
  throw new Error("NEXT_PUBLIC_ADMIN_URL is not configured");
}

const convex = new ConvexHttpClient(convexUrl);

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

  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken) {
    return NextResponse.json(
      { ok: false, error: "Unable to send invite" },
      { status: 400 },
    );
  }

  try {
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
      { status: 400 },
    );
  }
}

