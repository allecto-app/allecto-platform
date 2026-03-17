import { NextResponse } from "next/server";
import { api } from "../../../src/lib/convexGenerated";
import { createServerConvexClient } from "../../../src/lib/serverConvex";
import { buildAdminSessionCookieOptions, getAdminSessionCookie } from "../../../src/lib/serverSession";

export async function POST() {
  const sessionToken = getAdminSessionCookie();
  if (sessionToken) {
    try {
      const convex = createServerConvexClient();
      await convex.mutation((api as any).auth.logout, { token: sessionToken });
    } catch (error) {
      console.error("[logout] Failed to revoke server session", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...buildAdminSessionCookieOptions(new Date(0)),
    value: "",
  });
  return response;
}
