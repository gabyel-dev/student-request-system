import { NextRequest, NextResponse } from "next/server";
import { tokenService } from "@/src/infrastructure/auth/jose.token.service";
import { refreshUserSession } from "@/src/server/refresh-session";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
} from "@/src/server/session";

function resolveNextParam(value: string | null): string {
  if (!value) return "/dashboard";
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "/dashboard";
  }
  // Same-origin absolute paths only; reject protocol-relative and API loops.
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/dashboard";
  }
  if (decoded.startsWith("/api/auth/refresh")) {
    return "/dashboard";
  }
  return decoded;
}

function setSessionCookiesOn(
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
 * GET is the proxy.ts handoff target: proxy.ts stays free of database I/O
 * and redirects here when the access token is expired but a refresh cookie
 * exists. This handler owns the expensive DB-backed refresh + rotation, sets
 * the new cookies, and redirects back to `?next=`. On failure it clears both
 * cookies and redirects to /login.
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (accessToken && (await tokenService.verifyAccessToken(accessToken))) {
    return NextResponse.redirect(
      new URL(resolveNextParam(request.nextUrl.searchParams.get("next")), request.url),
    );
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  const result = await refreshUserSession(refreshToken);

  if (!result) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.redirect(
    new URL(resolveNextParam(request.nextUrl.searchParams.get("next")), request.url),
  );
  return setSessionCookiesOn(response, result.accessToken, result.refreshToken);
}

/*
 * This endpoint exposes the same refresh operation for a direct POST request.
 * The active page-protection flow normally runs through proxy.ts, but this
 * route can also check the access cookie, refresh the session, and return the
 * new access token as JSON. It clears both cookies when the refresh token is
 * no longer valid.
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (accessToken && (await tokenService.verifyAccessToken(accessToken))) {
    return NextResponse.json({ accessToken });
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
  const result = await refreshUserSession(refreshToken);

  if (!result) {
    const response = NextResponse.json(
      { error: "unauthorized" },
      { status: 401 },
    );
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.json({
    accessToken: result.accessToken,
  });

  response.cookies.set(ACCESS_TOKEN_COOKIE, result.accessToken, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });

  return response;
}
