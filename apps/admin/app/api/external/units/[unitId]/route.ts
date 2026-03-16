
import { NextResponse } from "next/server";
import { api, Id } from "../../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, requireAccessToken } from "../../_lib/routeUtils";

export async function GET(request: Request, { params }: { params: { unitId: string } }) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const unitId = params?.unitId;
  if (!unitId) {
    return badRequest("unitId is required");
  }

  try {
    const item = await convex.query(api.externalApi.getUnitDetail, {
      accessToken: auth.token,
      unitId: unitId as Id<"units">,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return mapConvexError(error);
  }
}
