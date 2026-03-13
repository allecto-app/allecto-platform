'use server';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api, Id } from "../../../../src/lib/convexGenerated";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexHttpClient(convexUrl);

type RevokeInvitePayload = {
  inviteId?: string;
};

export async function POST(request: Request) {
  let payload: RevokeInvitePayload;
  try {
    payload = (await request.json()) as RevokeInvitePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível revogar o convite" },
      { status: 400 },
    );
  }

  const inviteId = payload.inviteId as Id<"invites"> | undefined;
  if (!inviteId) {
    return NextResponse.json(
      { ok: false, error: "Não foi possível revogar o convite" },
      { status: 400 },
    );
  }

  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken) {
    return NextResponse.json(
      { ok: false, error: "Não autorizado" },
      { status: 401 },
    );
  }

  try {
    await convex.mutation(api.invites.revoke, {
      token: sessionToken,
      inviteId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invite revoke failed", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível revogar o convite" },
      { status: 400 },
    );
  }
}
