import { NextRequest, NextResponse } from "next/server";
import { tokenService } from "@/src/infrastructure/auth/jose.token.service";
import { refreshUserSession } from "@/src/server/refresh-session";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
} from "@/src/server/session";

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
