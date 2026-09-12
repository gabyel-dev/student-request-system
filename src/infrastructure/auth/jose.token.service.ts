import { SignJWT, jwtVerify } from "jose";
import { env } from "@/src/infrastructure/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

const ACCESS_TOKEN_TTL_SECONDS = 5 * 60; // 10 nm seconds for testing

export const tokenService = {
  // Step 10: Create a signed JWT containing the user's ID. The JWT expires
  // after 10 seconds while testing, so proxy.ts will eventually refresh it.
  async signAccessToken(input: { userId: string }): Promise<string> {
    return new SignJWT({ sub: input.userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(secret);
  },

  // Step 6: Check that the JWT was signed by this server and has not expired.
  // Return the user ID when valid; return null when invalid or expired.
  async verifyAccessToken(token: string): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      return payload.sub ? String(payload.sub) : null;
    } catch {
      return null;
    }
  },
};
