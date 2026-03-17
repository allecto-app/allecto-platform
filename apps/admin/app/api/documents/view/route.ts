import { NextResponse } from "next/server";
import { api } from "../../../../src/lib/convexGenerated";
import { createServerConvexClient } from "../../../../src/lib/serverConvex";

function extractClientIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || undefined;
}

function safeFileName(input: string) {
  return (input || "document")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewToken = searchParams.get("token");
  if (!viewToken) {
    return NextResponse.json({ ok: false, error: "Invalid or expired link" }, { status: 400 });
  }

  try {
    const convex = createServerConvexClient();
    const redeemed = await convex.mutation((api as any).documents.redeemViewToken, {
      viewToken,
      clientIp: extractClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const upstream = await fetch(redeemed.fileUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ ok: false, error: "Unable to process request" }, { status: 502 });
    }

    const filename = safeFileName(redeemed.title || "document") + ".pdf";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": redeemed.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "INVALID_OR_EXPIRED_LINK" ? 400 : 500;
    const responseMessage =
      message === "INVALID_OR_EXPIRED_LINK" ? "Invalid or expired link" : "Unable to process request";
    return NextResponse.json({ ok: false, error: responseMessage }, { status });
  }
}
