import { NextRequest, NextResponse } from "next/server";

/**
 * Optional protection for Vercel Preview deployments.
 * Set both values as Vercel Preview environment variables to require a browser
 * username/password prompt. Local development and production are unaffected.
 */
export function middleware(request: NextRequest) {
  const username = process.env.VERCEL_PREVIEW_USERNAME;
  const password = process.env.VERCEL_PREVIEW_PASSWORD;
  const isPreview = process.env.VERCEL_ENV === "preview";
  if (!isPreview || !username || !password) return NextResponse.next();

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Basic ")) {
    const encoded = authorization.slice("Basic ".length);
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator >= 0 && decoded.slice(0, separator) === username && decoded.slice(separator + 1) === password) return NextResponse.next();
  }

  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="SellerApp Preview"' } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"] };
