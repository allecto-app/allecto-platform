import { NextResponse } from "next/server";
import { api } from "../../../../src/lib/convexGenerated";
import { createServerConvexClient } from "../../../../src/lib/serverConvex";
import { buildAdminSessionCookieOptions, getAdminSessionCookie } from "../../../../src/lib/serverSession";

export async function GET() {
  const sessionToken = getAdminSessionCookie();
  if (!sessionToken) {
    return NextResponse.json({ ok: true, session: null });
  }

  try {
    const convex = createServerConvexClient();
    const session = await convex.query((api as any).auth.getSession, { token: sessionToken });
    if (!session) {
      const response = NextResponse.json({ ok: true, session: null });
      response.cookies.set({
        ...buildAdminSessionCookieOptions(new Date(0)),
        value: "",
      });
      return response;
    }
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    console.error("[session/me] Failed to load session", error);
    return NextResponse.json({ ok: true, session: null });
  }
}
