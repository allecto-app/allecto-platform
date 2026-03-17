'use server';

import { NextResponse } from "next/server";
import { api, Id } from "../../../../src/lib/convexGenerated";
import { createServerConvexClient } from "../../../../src/lib/serverConvex";
import { getAdminSessionCookie } from "../../../../src/lib/serverSession";

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

  const sessionToken = getAdminSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { ok: false, error: "Unable to process request" },
      { status: 401 },
    );
  }

  try {
    const convex = createServerConvexClient();
    await convex.mutation(api.invites.revoke, {
      token: sessionToken,
      inviteId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invite revoke failed", error);
    return NextResponse.json(
      { ok: false, error: "Unable to process request" },
      { status: 429 },
    );
  }
}
