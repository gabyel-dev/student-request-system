import { createHash, randomBytes } from "crypto";

const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Step 11: Generate a refresh token for the browser and the hash/expiry values
// that refresh-token-repository.supabase.ts stores in Supabase.
export function generateRefreshToken() {
  const token = randomBytes(48).toString("base64url");
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  };
}

// Step 9: Convert the browser's raw refresh token into the hash used for the
// Supabase lookup. This keeps the raw token out of the database.
export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
