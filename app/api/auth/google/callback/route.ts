import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { googleLogin } from "@/src/server/container";
import { env } from "@/src/infrastructure/env";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
} from "@/src/server/session";

/**
 * Google OAuth 2.0 — Authorization Code Flow (Step 2 of 4: Token Exchange)
 *
 * This route handler is the "redirect_uri" Google sends the user back to after consent.
 * It receives a temporary authorization code and exchanges it for tokens:
 *
 *   1. Google redirects here with ?code=AUTHORIZATION_CODE&state=CSRF_TOKEN
 *   2. We verify the state parameter matches the one stored in the cookie (CSRF protection)
 *   3. We send a POST to Google's token endpoint with:
 *        - code:            The authorization code from step 1
 *        - client_id:       Our app's identifier
 *        - client_secret:   Our app's secret (never exposed to the browser)
 *        - redirect_uri:    Must match exactly what was sent in step 1
 *        - grant_type:      Always "authorization_code" for this flow
 *
 *   4. Google responds with:
 *        - id_token:    A signed JWT containing the user's identity (email, name, etc.)
 *        - access_token: Used for calling Google APIs (not needed here)
 *
 *   5. We verify the id_token server-side (Step 3), create/find the user, and
 *      issue our own session cookies, then redirect to /dashboard.
 *
 * Token types in this flow:
 *   - Authorization Code: Short-lived, single-use, exchanged for tokens server-side
 *   - ID Token:           A JWT proving the user's identity, signed by Google
 *   - Access Token:       Our own short-lived (5 min) JWT for API requests
 *   - Refresh Token:      Long-lived opaque token (hashed in the DB) used for silent renewal
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // CSRF protection: verify the state parameter matches what we stored in the cookie.
  // An attacker cannot forge this because they can't set cookies on our domain.
  const cookieState = request.cookies.get("oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Exchange the authorization code for tokens with Google's token endpoint.
    // This is a server-to-server call — the client_secret never reaches the browser.
    const { data: tokenData } = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
          grant_type: "authorization_code",
        },
      },
    );

    if (!tokenData.id_token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Step 3: Verify the ID token and create/find the user in our database.
    // The ID token is a JWT signed by Google — we verify its signature and extract user data.
    const { accessToken, refreshToken, user } = await googleLogin.execute({
      credential: tokenData.id_token,
    });

    // Step 4: Set our session cookies and redirect to the dashboard.
    // httpOnly refresh_token prevents JavaScript from reading it (XSS protection).
    const destination =
      user.section && user.studentNumber !== null
        ? "/dashboard"
        : "/onboarding";
    const response = NextResponse.redirect(new URL(destination, request.url));

    // Clear the CSRF state cookie (one-time use)
    response.cookies.delete("oauth_state");

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
  } catch {
    console.error("Google OAuth callback failed");
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
