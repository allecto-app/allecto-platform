import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (
    (hostname === "allecto.app" || hostname === "www.allecto.app") &&
    (pathname === "/blog" || pathname.startsWith("/pt/"))
  ) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https";
    destination.hostname = "blog.allecto.app";
    destination.port = "";
    destination.pathname = pathname === "/blog" ? "/" : pathname;
    return NextResponse.redirect(destination, 308);
  }

  if (hostname === "blog.allecto.app" && pathname === "/blog") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    return NextResponse.redirect(destination, 308);
  }

  if (hostname === "blog.allecto.app" && pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/blog";
    return NextResponse.rewrite(destination);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
