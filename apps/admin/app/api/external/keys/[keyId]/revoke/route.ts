
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { api, Id } from "../../../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, unauthorized } from "../../../_lib/routeUtils";

export async function POST(_: Request, { params }: { params: { keyId: string } }) {
  const sessionToken = cookies().get("allecto_admin")?.value;
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
