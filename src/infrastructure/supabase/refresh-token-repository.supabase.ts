import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

const client = getSupabaseClient();

export const refreshTokenRepository = {
  // Step 1/11: Store a hashed refresh token and its expiry for a user.
  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const { error } = await client.from("refresh_tokens").insert({
      user_id: input.userId,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt.toISOString(),
    });
    if (error) throw error;
  },

  // Step 10: Find the stored token record so refresh-session.ts can validate it.
  async findByTokenHash(tokenHash: string) {
    const { data, error } = await client
      .from("refresh_tokens")
      .select("user_id, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      userId: data.user_id as string,
      expiresAt: new Date(data.expires_at as string),
      revokedAt: data.revoked_at ? new Date(data.revoked_at) : null,
    };
  },

  // Logout uses this to invalidate a token without exposing its raw value.
  async revokeByTokenHash(tokenHash: string): Promise<void> {
    const { error } = await client
      .from("refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", tokenHash);
    if (error) throw error;
  },

  // Step 11: Remove an expired token before storing its replacement.
  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const { error } = await client
      .from("refresh_tokens")
      .delete()
      .eq("token_hash", tokenHash);
    if (error) throw error;
  },
};
