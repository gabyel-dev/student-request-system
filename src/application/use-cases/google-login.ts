import { verifyGoogleToken } from "@/src/infrastructure/auth/google-oauth.service";
import { tokenService } from "@/src/infrastructure/auth/jose.token.service";
import { generateRefreshToken } from "@/src/infrastructure/auth/refresh-token";
import { refreshTokenRepository } from "@/src/infrastructure/supabase/refresh-token-repository.supabase";
import type { UserRepository } from "@/src/application/ports/user.repository";
import { UnauthorizedDomainError } from "@/src/application/errors";
import type { User } from "@/src/domain/user";
import { storeGoogleProfilePicture } from "@/src/infrastructure/supabase/profile-picture-storage";

const ALLOWED_DOMAIN = "paterostechnologicalcollege.edu.ph";

export function createGoogleLogin(deps: { userRepository: UserRepository }) {
  return {
    async execute(input: { credential: string }): Promise<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }> {
      if (!input.credential) {
        throw new Error("Invalid Google credential");
      }

      const googleUser = await verifyGoogleToken(input.credential);

      const domain = googleUser.email.split("@")[1];
      if (domain !== ALLOWED_DOMAIN) {
        throw new UnauthorizedDomainError();
      }

      let user = await deps.userRepository.findByEmail(googleUser.email);
      if (!user) {
        user = await deps.userRepository.create({
          fullName: googleUser.name,
          email: googleUser.email,
        });
      }

      if (googleUser.picture) {
        try {
          const profilePictureUrl = await storeGoogleProfilePicture({
            email: googleUser.email,
            pictureUrl: googleUser.picture,
          });
          if (profilePictureUrl) {
            user = await deps.userRepository.updateProfilePicture({
              id: user.id,
              profilePictureUrl,
            });
          }
        } catch (error) {
          console.error("Google profile picture storage failed", error);
        }
      }

      const accessToken = await tokenService.signAccessToken({
        userId: user.id,
      });

      // Store only the hash of the refresh token — never the raw value.
      const {
        token: refreshToken,
        tokenHash,
        expiresAt,
      } = generateRefreshToken();
      await refreshTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      return { accessToken, refreshToken, user };
    },
  };
}
