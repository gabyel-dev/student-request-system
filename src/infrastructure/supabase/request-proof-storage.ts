import { randomUUID } from "node:crypto";
import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

const BUCKET = "request_proofs";

export async function storeRequestProof(input: {
  userId: string;
  file: File;
}): Promise<string> {
  const safeName = input.file.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const extension = safeName.split(".").pop() || "bin";
  const path = `${input.userId}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const client = getSupabaseClient();

  const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
    cacheControl: "3600",
  });

  if (error) throw error;
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}