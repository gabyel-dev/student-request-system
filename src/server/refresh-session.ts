import { tokenService } from "@/src/infrastructure/auth/jose.token.service";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "@/src/infrastructure/auth/refresh-token";
import { refreshTokenRepository } from "@/src/infrastructure/supabase/refresh-token-repository.supabase";

// Step 9-11: Validate the refresh token, rotate it when necessary, and ask
// jose.token.service.ts for a new access token.
export async function refreshUserSession(refreshToken: string | null): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
} | null> {
  if (!refreshToken) return null;

  const stored = await refreshTokenRepository.findByTokenHash(
    hashRefreshToken(refreshToken),
  );
  if (!stored || stored.revokedAt) return null;

  let currentRefreshToken = refreshToken;
  if (stored.expiresAt.getTime() <= Date.now()) {
    await refreshTokenRepository.deleteByTokenHash(
      hashRefreshToken(refreshToken),
    );

    const replacement = generateRefreshToken();
    await refreshTokenRepository.create({
      userId: stored.userId,
      tokenHash: replacement.tokenHash,
      expiresAt: replacement.expiresAt,
    });
    currentRefreshToken = replacement.token;
  }

  const accessToken = await tokenService.signAccessToken({
    userId: stored.userId,
  });

  return {
    accessToken,
    refreshToken: currentRefreshToken,
    userId: stored.userId,
  };
}
