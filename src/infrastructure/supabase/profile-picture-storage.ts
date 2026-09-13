import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

const BUCKET = "profile_pictures";

function profilePicturePath(email: string) {
  const localPart = email.split("@")[0] ?? "profile";
  const safeLocalPart = localPart.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `${safeLocalPart}_profile.png`;
}

export async function storeGoogleProfilePicture(input: {
  email: string;
  pictureUrl?: string;
}) {
  if (!input.pictureUrl) return null;

  const imageResponse = await fetch(input.pictureUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Google profile picture download failed: ${imageResponse.status}`,
    );
  }

  const image = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get("content-type") ?? "image/png";
  const path = profilePicturePath(input.email);
  const client = getSupabaseClient();
  const { error } = await client.storage.from(BUCKET).upload(path, image, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  });

  if (error) throw error;
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
