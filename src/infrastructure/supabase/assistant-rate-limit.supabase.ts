import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

export type AssistantRateLimitBucket = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export type AssistantRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number; bucket: string };

type RateLimitRow = {
  allowed: boolean;
  retry_after: number | string | null;
  bucket_key: string | null;
};

export async function consumeAssistantRateLimit(
  buckets: AssistantRateLimitBucket[],
): Promise<AssistantRateLimitResult> {
  const { data, error } = await getSupabaseClient().rpc(
    "consume_assistant_rate_limits",
    {
      p_buckets: buckets.map((bucket) => ({
        key: bucket.key,
        limit: bucket.limit,
        window_seconds: bucket.windowSeconds,
      })),
    },
  );

  if (error) {
    const missingFunction =
      error.code === "PGRST202" ||
      error.message.toLowerCase().includes("could not find the function");
    if (missingFunction) {
      console.warn(
        "Assistant rate-limit function is missing. Run database/assistant-rate-limit.sql in Supabase.",
      );
      return { allowed: true };
    }
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
  if (!row || row.allowed !== false) return { allowed: true };

  const retryAfter = Number(row.retry_after);
  return {
    allowed: false,
    retryAfter:
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60,
    bucket: row.bucket_key ?? "assistant:global:minute",
  };
}
