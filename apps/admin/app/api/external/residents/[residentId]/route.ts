
import { NextResponse } from "next/server";
import { api, Id } from "../../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, parseClientIp, requireAccessToken } from "../../_lib/routeUtils";

export async function GET(request: Request, { params }: { params: { residentId: string } }) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const residentId = params?.residentId;
  if (!residentId) {
    return badRequest("residentId is required");
  }

  try {
    const item = await convex.query(api.externalApi.getResidentDetail, {
      accessToken: auth.token,
      residentId: residentId as Id<"residents">,
      clientIp: parseClientIp(request),
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return mapConvexError(error);
  }
}
