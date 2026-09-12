import { cookies, headers } from "next/headers";
import { tokenService } from "@/src/infrastructure/auth/jose.token.service";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
} from "@/src/lib/auth/session-cookies";

export {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
};

const secure = process.env.NODE_ENV === "production";

const USER_ID_HEADER = "x-authenticated-user-id";

// Dashboard and other server pages use this to get the user ID. proxy.ts has
// already verified the header; otherwise this function verifies the cookie.
export async function getSessionTokenUserId(): Promise<string | null> {
  const headersStore = await headers();
  const userIdFromProxy = headersStore.get(USER_ID_HEADER);
  if (userIdFromProxy) return userIdFromProxy;

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (!token) return null;
  return tokenService.verifyAccessToken(token);
}

// Logout uses this to find the refresh token that must be revoked in Supabase.
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

// Login or refresh uses this to send both session cookies back to the browser.
export async function setSessionCookies(input: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, input.accessToken, {
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, input.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
}

// Logout uses this to remove both session cookies from the browser.
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
