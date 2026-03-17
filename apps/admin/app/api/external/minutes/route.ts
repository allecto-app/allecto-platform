
import { NextResponse } from "next/server";
import { api, Id } from "../../../../src/lib/convexGenerated";
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

type CreateMinutePayload = {
  title?: string;
  summary?: string;
  documentId?: string;
  closesAt?: number;
};

export async function GET(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const limit = clampLimit(parseOptionalNumber(url.searchParams.get("limit")));
  const page = clampPage(parseOptionalNumber(url.searchParams.get("page")));
  const status = statusParam === "open" || statusParam === "closed" ? statusParam : undefined;
  const clientIp = parseClientIp(request);

  try {
    const items = await convex.query(api.externalApi.getMinutes, {
      accessToken: auth.token,
      status,
      limit,
      page,
      clientIp,
    }) as Record<string, unknown>;
    return NextResponse.json({ ok: true, ...items });
  } catch (error) {
    return mapConvexError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;
  const clientIp = parseClientIp(request);

  const payload = await readJson<CreateMinutePayload>(request);
  if (!payload?.title?.trim()) {
    return badRequest("title is required");
  }
  if (!isSafeText(payload.title, 180) || !isSafeText(payload.summary, 3000)) {
    return badRequest("Invalid minute payload");
  }
  if (!payload?.documentId) {
    return badRequest("documentId is required");
  }
  if (!payload?.closesAt || payload.closesAt <= Date.now()) {
    return badRequest("closesAt must be a future timestamp in ms");
  }

  try {
    const item = await convex.mutation(api.externalApi.createMinute, {
      accessToken: auth.token,
      title: payload.title.trim(),
      summary: payload.summary?.trim() || undefined,
      documentId: payload.documentId as Id<"documents">,
      closesAt: payload.closesAt,
      clientIp,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return mapConvexError(error);
  }
}
