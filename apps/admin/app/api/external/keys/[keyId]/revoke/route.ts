
import { NextResponse } from "next/server";
import { api, Id } from "../../../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, unauthorized } from "../../../_lib/routeUtils";
import { getAdminSessionCookie } from "../../../../../../src/lib/serverSession";

export async function POST(_: Request, { params }: { params: { keyId: string } }) {
  const sessionToken = getAdminSessionCookie();
  if (!sessionToken) {
    return unauthorized("Not authenticated");
  }

  const keyId = params?.keyId;
  if (!keyId) {
    return badRequest("keyId is required");
  }

  try {
    await convex.mutation(api.externalApi.revokeApiKey, {
      token: sessionToken,
      keyId: keyId as Id<"externalApiKeys">,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapConvexError(error);
  }
}
