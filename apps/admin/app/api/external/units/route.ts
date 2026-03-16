
import { NextResponse } from "next/server";
import { api } from "../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, requireAccessToken, readJson } from "../_lib/routeUtils";

type CreateUnitPayload = {
  code?: string;
  block?: string;
  floor?: string;
};

export async function GET(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const units = await convex.query(api.externalApi.getUnits, {
      accessToken: auth.token,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ ok: true, items: units });
  } catch (error) {
    return mapConvexError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const payload = await readJson<CreateUnitPayload>(request);
  if (!payload?.code?.trim()) {
    return badRequest("code is required");
  }

  try {
    const unit = await convex.mutation(api.externalApi.createUnit, {
      accessToken: auth.token,
      code: payload.code.trim(),
      block: payload.block?.trim() || undefined,
      floor: payload.floor?.trim() || undefined,
    });
    return NextResponse.json({ ok: true, item: unit });
  } catch (error) {
    return mapConvexError(error);
  }
}
