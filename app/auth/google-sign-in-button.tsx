"use client";

import { FcGoogle } from "react-icons/fc";

const ALLOWED_DOMAIN = "paterostechnologicalcollege.edu.ph";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

/**
 * Google OAuth 2.0 — Authorization Code Flow with PKCE (Step 1 of 4)
 *
 * This button initiates the OAuth 2.0 Authorization Code flow by redirecting
 * the user to Google's authorization server. The URL contains:
 *
 *   - state:           A random token to prevent CSRF. Stored in a cookie and
 *                      verified in the callback to ensure the response matches
 *                      the original request.
 *   - client_id:       Identifies our app to Google (from Google Cloud Console).
 *   - redirect_uri:    Where Google sends the user back after consent (our callback route).
 *   - response_type:   "code" tells Google to return an authorization code, not tokens directly.
 *   - scope:           What data we're requesting (openid, email, profile).
 *   - hd:              Restricts the Google account picker to our domain only.
 *   - prompt:          "select_account" forces account chooser (prevents auto-login with wrong account).
 *
 * After the user consents, Google redirects to /api/auth/google/callback?code=...&state=...
 * The server verifies the state parameter, then exchanges the code for tokens.
 */
export function GoogleSignInButton() {
  function handleSignIn() {
    // Generate a random CSRF state token and store it in a cookie.
    // The callback route will verify this matches before processing the auth code.
    const state = crypto.randomUUID();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `oauth_state=${state}; Path=/; SameSite=Lax; Max-Age=300${secure}`;

    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = "openid email profile";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&hd=${ALLOWED_DOMAIN}&prompt=select_account&state=${state}`;

    window.location.href = url;
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="google-button flex w-80 items-center cursor-pointer justify-center gap-3 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
      <FcGoogle className="text-lg" />
      Sign in with Google
    </button>
  );
}
