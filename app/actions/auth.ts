"use server";

import { clearSessionCookie, getRefreshToken } from "@/src/server/session";
import { refreshTokenRepository } from "@/src/infrastructure/supabase/refresh-token-repository.supabase";
import { hashRefreshToken } from "@/src/infrastructure/auth/refresh-token";

/**
 * Deletes the refresh-token record and clears the auth cookies. The caller
 * navigates after this resolves: a redirect thrown from inside the action can
 * leave the client's loading state behind, and a full-page reload aborts the
 * action response before it finishes writing.
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
