
import { NextResponse } from "next/server";
import { api, Id } from "../../../../src/lib/convexGenerated";
import { badRequest, convex, isSafeText, mapConvexError, readJson, unauthorized } from "../_lib/routeUtils";
import { getAdminSessionCookie } from "../../../../src/lib/serverSession";

type CreateKeyPayload = {
  condoId?: string;
  name?: string;
  expiresAt?: number;
  scopes?: string[];
  allowedIps?: string[];
};

export async function GET(request: Request) {
  const sessionToken = getAdminSessionCookie();
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
  const sessionToken = getAdminSessionCookie();
  if (!sessionToken) {
    return unauthorized("Not authenticated");
  }

  const payload = await readJson<CreateKeyPayload>(request);
  if (!payload?.condoId) {
    return badRequest("condoId is required");
  }
  if (!isSafeText(payload.name, 120)) {
    return badRequest("Invalid key payload");
  }
  if (payload.scopes && (!Array.isArray(payload.scopes) || payload.scopes.length === 0)) {
    return badRequest("Invalid scopes");
  }
  if (payload.allowedIps && !Array.isArray(payload.allowedIps)) {
    return badRequest("Invalid allowedIps");
  }

  try {
    const result = (await convex.mutation(api.externalApi.createApiKey, {
      token: sessionToken,
      condoId: payload.condoId as Id<"condos">,
      name: payload.name?.trim() || undefined,
      expiresAt: payload.expiresAt,
      scopes: payload.scopes,
      allowedIps: payload.allowedIps,
    })) as Record<string, unknown>;
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapConvexError(error);
  }
}
