
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
  const limit = clampLimit(parseOptionalNumber(url.searchParams.get("limit")));
  const page = clampPage(parseOptionalNumber(url.searchParams.get("page")));
  const clientIp = parseClientIp(request);

  try {
    const residents = await convex.query(api.externalApi.getResidents, {
      accessToken: auth.token,
      limit,
      page,
      clientIp,
    });
    return NextResponse.json({ ok: true, ...residents });
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
  if (!isSafeText(payload.name, 120) || !isSafeText(payload.email, 160) || !isSafeText(payload.phone, 40)) {
    return badRequest("Invalid resident payload");
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
      clientIp: parseClientIp(request),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapConvexError(error);
  }
}
