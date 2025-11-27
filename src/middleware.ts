import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Force all auth routes to use the correct domain
  const correctDomain = "quizmify-fixed-final.vercel.app";

  if (url.hostname !== correctDomain) {
    // Redirect to production domain
    url.hostname = correctDomain;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
