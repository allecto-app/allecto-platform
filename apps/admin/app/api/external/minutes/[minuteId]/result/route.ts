
import { NextResponse } from "next/server";
import { api, Id } from "../../../../../../src/lib/convexGenerated";
import {
  badRequest,
  clampLimit,
  convex,
  mapConvexError,
  parseBoolean,
  parseClientIp,
  parseOptionalNumber,
  requireAccessToken,
} from "../../../_lib/routeUtils";

export async function GET(request: Request, { params }: { params: { minuteId: string } }) {
  const auth = await requireAccessToken(request);
  if ("error" in auth) return auth.error;

  const minuteId = params?.minuteId;
  if (!minuteId) {
    return badRequest("minuteId is required");
  }
  const url = new URL(request.url);
  const includeVotes = parseBoolean(url.searchParams.get("includeVotes"), false);
  const votesLimit = clampLimit(parseOptionalNumber(url.searchParams.get("votesLimit")), 25, 100);

  try {
    const item = await convex.query(api.externalApi.getMinuteResult, {
      accessToken: auth.token,
      minuteId: minuteId as Id<"minutes">,
      includeVotes,
      votesLimit,
      clientIp: parseClientIp(request),
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return mapConvexError(error);
  }
}
