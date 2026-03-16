
import { NextResponse } from "next/server";
import { api } from "../../../../src/lib/convexGenerated";
import {
  badRequest,
  clampLimit,
  clampPage,
  convex,
  isSafeText,
  mapConvexError,
  parseClientIp,
  parseOptionalNumber,
  requireAccessToken,
  readJson,
} from "../_lib/routeUtils";

type CreateUnitPayload = {
  code?: string;
  block?: string;
  floor?: string;
};

export async function GET(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const limit = clampLimit(parseOptionalNumber(url.searchParams.get("limit")));
  const page = clampPage(parseOptionalNumber(url.searchParams.get("page")));
  const clientIp = parseClientIp(request);

  try {
    const units = await convex.query(api.externalApi.getUnits, {
      accessToken: auth.token,
      limit,
      page,
      clientIp,
    });
    return NextResponse.json({ ok: true, ...units });
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
  if (!isSafeText(payload.code, 80) || !isSafeText(payload.block, 40) || !isSafeText(payload.floor, 40)) {
    return badRequest("Invalid unit payload");
  }

  try {
    const unit = await convex.mutation(api.externalApi.createUnit, {
      accessToken: auth.token,
      code: payload.code.trim(),
      block: payload.block?.trim() || undefined,
      floor: payload.floor?.trim() || undefined,
      clientIp: parseClientIp(request),
    });
    return NextResponse.json({ ok: true, item: unit });
  } catch (error) {
    return mapConvexError(error);
  }
}
