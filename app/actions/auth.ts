"use server";

import { clearSessionCookie, getRefreshToken } from "@/src/server/session";
import { refreshTokenRepository } from "@/src/infrastructure/supabase/refresh-token-repository.supabase";
import { hashRefreshToken } from "@/src/infrastructure/auth/refresh-token";

/**
 * Deletes the refresh-token record and clears the auth cookies. It deliberately
 * does not call redirect(): the client performs a full page navigation after
 * the server action finishes.
 */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await refreshTokenRepository.deleteByTokenHash(
      hashRefreshToken(refreshToken),
    );
  }
  await clearSessionCookie();
}
