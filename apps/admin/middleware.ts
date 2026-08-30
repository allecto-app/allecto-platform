import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (hostname === "blog.allecto.app") {
    return NextResponse.redirect(new URL("/blog", "https://www.allecto.app"));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
