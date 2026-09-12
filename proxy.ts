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

// Save the new tokens after a successful refresh.
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
 * This function runs before a page is rendered:
 *
 * 1. Skip public requests.
 * 2. Check the short-lived access token.
 * 3. If valid, allow the request.
 * 4. If expired, use the refresh token to create a new access token.
 * 5. Save the new cookies and allow the original request.
 * 6. If refresh fails, send the user to /login.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRequest(pathname)) {
    return NextResponse.next();
  }

  // First try the short-lived access token.
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const userId = accessToken
    ? await tokenService.verifyAccessToken(accessToken)
    : null;

  if (userId) {
    return allowRequest(request, userId);
  }

  // The access token is missing or expired, so try the refresh token.
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  const result = await refreshUserSession(refreshToken);

  if (!result) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = allowRequest(request, result.userId);
  return saveSessionCookies(response, result.accessToken, result.refreshToken);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
