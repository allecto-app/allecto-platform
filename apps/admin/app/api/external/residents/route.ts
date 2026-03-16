
import { NextResponse } from "next/server";
import { api, Id } from "../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, requireAccessToken, readJson } from "../_lib/routeUtils";

type CreateResidentPayload = {
  name?: string;
  email?: string;
  phone?: string;
  role?: "resident" | "syndic" | "manager" | "council";
  unitId?: string;
  membershipRole?: "owner" | "tenant";
};

export async function GET(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const residents = await convex.query(api.externalApi.getResidents, {
      accessToken: auth.token,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ ok: true, items: residents });
  } catch (error) {
    return mapConvexError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const payload = await readJson<CreateResidentPayload>(request);
  if (!payload?.name?.trim()) {
    return badRequest("name is required");
  }

  try {
    const result = await convex.mutation(api.externalApi.createResident, {
      accessToken: auth.token,
      name: payload.name.trim(),
      email: payload.email?.trim() || undefined,
      phone: payload.phone?.trim() || undefined,
      role: payload.role,
      unitId: payload.unitId as Id<"units"> | undefined,
      membershipRole: payload.membershipRole,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapConvexError(error);
  }
}
