
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { api, Id } from "../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, readJson, unauthorized } from "../_lib/routeUtils";

type CreateKeyPayload = {
  condoId?: string;
  name?: string;
  expiresAt?: number;
};

export async function GET(request: Request) {
  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken) {
    return unauthorized("Not authenticated");
  }

  const url = new URL(request.url);
  const condoId = url.searchParams.get("condoId");
  if (!condoId) {
    return badRequest("condoId is required");
  }

  try {
    const items = await convex.query(api.externalApi.listApiKeys, {
      token: sessionToken,
      condoId: condoId as Id<"condos">,
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return mapConvexError(error);
  }
}

export async function POST(request: Request) {
  const sessionToken = cookies().get("allecto_admin")?.value;
  if (!sessionToken) {
    return unauthorized("Not authenticated");
  }

  const payload = await readJson<CreateKeyPayload>(request);
  if (!payload?.condoId) {
    return badRequest("condoId is required");
  }

  try {
    const result = await convex.mutation(api.externalApi.createApiKey, {
      token: sessionToken,
      condoId: payload.condoId as Id<"condos">,
      name: payload.name?.trim() || undefined,
      expiresAt: payload.expiresAt,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapConvexError(error);
  }
}
