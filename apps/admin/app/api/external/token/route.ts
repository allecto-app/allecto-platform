
import { NextResponse } from "next/server";
import { badRequest, callIssueToken, mapConvexError, readJson } from "../_lib/routeUtils";

type TokenPayload = {
  apiKey?: string;
  apiSecret?: string;
};

export async function POST(request: Request) {
  const payload = await readJson<TokenPayload>(request);
  if (!payload?.apiKey || !payload.apiSecret) {
    return badRequest("apiKey and apiSecret are required");
  }

  try {
    const result = await callIssueToken(payload.apiKey, payload.apiSecret);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapConvexError(error);
  }
}
