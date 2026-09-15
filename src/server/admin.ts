import { redirect } from "next/navigation";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";

export async function getCurrentUser() {
  const userId = await getSessionTokenUserId();
  if (!userId) return null;
  return userRepository.findById(userId);
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard");
  return user;
}
