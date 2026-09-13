import { OAuth2Client } from "google-auth-library";
import { env } from "@/src/infrastructure/env";

export interface GoogleTokenPayload {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}

/**
 * Google OAuth 2.0 — ID Token Verification (Step 3 of 4)
 *
 * An ID Token is a JWT (JSON Web Token) signed by Google. It contains:
 *   - iss:   Issuer — must be "accounts.google.com" or "https://accounts.google.com"
 *   - sub:   Subject — the user's unique Google account ID
 *   - email: The user's email address
 *   - name:  The user's display name
 *   - aud:   Audience — must match our client_id (prevents token misuse by other apps)
 *   - exp:   Expiration time
 *   - iat:   Issued-at time
 *
 * Verification checks:
 *   1. Signature — confirms the token was signed by Google's private key
 *   2. Audience — confirms the token was issued for our app (client_id)
 *   3. Expiration — confirms the token hasn't expired
 *
 * This is critical: without server-side verification, an attacker could craft
 * a fake token with any email. The signature check ensures authenticity.
 */
export async function verifyGoogleToken(
  credential: string,
): Promise<GoogleTokenPayload> {
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || payload.email_verified !== true) {
    throw new Error("Invalid Google token");
  }

  return {
    email: payload.email,
    name: payload.name ?? "",
    sub: payload.sub,
    picture: payload.picture,
  };
}
