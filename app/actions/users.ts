"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { refreshTokenRepository } from "@/src/infrastructure/supabase/refresh-token-repository.supabase";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";

export type DeleteAccountState = {
  error: string | null;
  success: string | null;
};

export async function deleteStudentAccount(
  userId: string,
): Promise<DeleteAccountState> {
  const adminId = await getSessionTokenUserId();
  if (!adminId) {
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };
  }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return {
      error: "That account could not be identified. Refresh and try again.",
      success: null,
    };
  }

  const admin = await userRepository.findById(adminId);
  if (!admin || !isAdminEmail(admin.email)) {
    return { error: "Admin access is required.", success: null };
  }
  if (adminId === userId) {
    return { error: "You cannot delete your own account.", success: null };
  }

  const student = await userRepository.findById(userId);
  if (!student) {
    return { error: "That account no longer exists.", success: null };
  }
  if (isAdminEmail(student.email)) {
    return { error: "Admin accounts cannot be deleted here.", success: null };
  }

  try {
    const requestCount = await requestRepository.deleteAllByUserId(userId);
    await refreshTokenRepository.deleteAllByUserId(userId);
    await userRepository.deleteById(userId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin/students");
    revalidatePath("/dashboard/admin/archive");

    const requestSummary =
      requestCount === 0
        ? ""
        : ` and ${requestCount} request${requestCount === 1 ? "" : "s"}`;
    return {
      error: null,
      success: `Deleted ${student.fullName}'s account${requestSummary}.`,
    };
  } catch {
    return {
      error: "The account could not be deleted. Check your connection and try again.",
      success: null,
    };
  }
}
