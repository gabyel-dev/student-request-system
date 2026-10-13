import { NextRequest, NextResponse } from "next/server";
import { tokenService } from "@/src/infrastructure/auth/jose.token.service";
import { refreshUserSession } from "@/src/server/refresh-session";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
} from "@/src/server/session";

const publicRoutes = [
  "/login",
  "/api/auth/google/callback",
  "/api/auth/refresh",
];

const USER_ID_HEADER = "x-authenticated-user-id";
const STATIC_FILE_EXT =
  /\.(?:webp|png|jpe?g|gif|svg|ico|css|js|woff2?|ttf|eot|avif)$/i;

// In-memory token bucket for auth endpoints only (/login, /api/auth/*).
// Per-isolate state: stops a single client queueing one instance, but does
// NOT share counts across Vercel instances. Upgrade to Upstash Redis (or
// similar) when cross-instance enforcement is needed.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_HITS = 30;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function isAuthRateLimited(key: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX_HITS) {
    return { limited: true, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfter: 0 };
}

function isAuthRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/api/auth/")
  );
}

// Public routes do not need an access token.
function isPublicRequest(pathname: string) {
  return (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    STATIC_FILE_EXT.test(pathname)
  );
}

// Let an authenticated request continue and pass its verified user ID onward.
function allowRequest(request: NextRequest, userId: string) {
  const headers = new Headers(request.headers);
  headers.set(USER_ID_HEADER, userId);
  return NextResponse.next({ request: { headers } });
}

// Save the new tokens after an inline refresh (mutations only, see below).
function saveSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
  return response;
}

/*
 * This function runs before a page is rendered.
 *
 * 1. Skip public requests.
 * 2. Verify the short-lived access token locally (HMAC, no I/O).
 * 3. If valid, allow the request.
 * 4. If expired and this is a navigation (GET/HEAD), hand off to
 *    /api/auth/refresh, which owns the DB-backed refresh and redirects back.
 * 5. If expired and this is a mutation (server-action POST, etc.), refresh
 *    inline: a redirect would destroy the original request (307 preserves
 *    the POST into the refresh endpoint, which answers JSON instead of the
 *    action result). Mutations with expired tokens are rare, so the
 *    occasional DB hit here preserves correctness without taxing the hot path.
 * 6. Otherwise send the user to /login.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAuthRoute(pathname)) {
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anon";
    const { limited, retryAfter } = isAuthRateLimited(
      `auth:${clientKey}`,
    );
    if (limited) {
      const response = new NextResponse("Too many login attempts", {
        status: 429,
      });
      response.headers.set("Retry-After", String(retryAfter));
      return response;
    }
  }

  if (isPublicRequest(pathname)) {
    return NextResponse.next();
  }

  // Fast path: local JWT verification only, no database or network I/O.
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const userId = accessToken
    ? await tokenService.verifyAccessToken(accessToken)
    : null;

  if (userId) {
    return allowRequest(request, userId);
  }

  const refreshToken =
    request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Mutations cannot survive a redirect: refresh inline and let the
    // original POST continue to its action.
    const result = await refreshUserSession(refreshToken);
    if (!result) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const response = allowRequest(request, result.userId);
    return saveSessionCookies(response, result.accessToken, result.refreshToken);
  }

  // Navigations hand off to the refresh route handler, keeping DB work out
  // of middleware on the hot path.
  const next = encodeURIComponent(`${pathname}${search}`);
  return NextResponse.redirect(
    new URL(`/api/auth/refresh?next=${next}`, request.url),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
