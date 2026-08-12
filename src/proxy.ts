import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const protectedPaths = ["/dashboard", "/admin", "/hrd", "/super"];

function allowedOrigin(request: NextRequest): string | null {
  const configured = process.env.ALLOWED_ORIGIN;
  if (!configured) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = configured
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = allowedOrigin(request);
  if (!origin) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Handle CORS preflight (OPTIONS) for API requests
  if (isApi && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applyCors(request, response);
    return response;
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return applyCors(request, NextResponse.redirect(loginUrl));
  }

  if (pathname === "/" && hasSession) {
    return applyCors(
      request,
      NextResponse.redirect(new URL("/dashboard", request.url))
    );
  }

  return applyCors(request, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/admin/:path*", "/hrd/:path*", "/super/:path*", "/"],
};
