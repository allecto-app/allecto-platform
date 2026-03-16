
import { NextResponse } from "next/server";
import { api, Id } from "../../../../../src/lib/convexGenerated";
import { badRequest, convex, mapConvexError, requireAccessToken } from "../../_lib/routeUtils";

export async function GET(request: Request, { params }: { params: { minuteId: string } }) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const minuteId = params?.minuteId;
  if (!minuteId) {
    return badRequest("minuteId is required");
  }

  try {
    const item = await convex.query(api.externalApi.getMinuteDetail, {
      accessToken: auth.token,
      minuteId: minuteId as Id<"minutes">,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return mapConvexError(error);
  }
}
