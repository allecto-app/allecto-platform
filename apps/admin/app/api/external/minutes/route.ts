
import { NextResponse } from "next/server";
import { api, Id } from "../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, requireAccessToken, readJson } from "../_lib/routeUtils";

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
  const limitParam = url.searchParams.get("limit");
  const statusParam = url.searchParams.get("status");
  const limit = limitParam ? Number(limitParam) : undefined;
  const status = statusParam === "open" || statusParam === "closed" ? statusParam : undefined;

  try {
    const items = await convex.query(api.externalApi.getMinutes, {
      accessToken: auth.token,
      status,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return mapConvexError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const payload = await readJson<CreateMinutePayload>(request);
  if (!payload?.title?.trim()) {
    return badRequest("title is required");
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
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return mapConvexError(error);
  }
}
