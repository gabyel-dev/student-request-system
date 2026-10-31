"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";

export type ProfileFormState = {
  error: string | null;
};

/** The registrar's standard issue format, e.g. 24BSIT-0123. */
const STANDARD_ID_PATTERN = /^(\d{2})([A-Z]{3,4})-(\d{4})$/;
const CUSTOM_ID_MAX_LENGTH = 32;

/** Only allow same-site paths back to the page the student came from. */
function safeReturnTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    return null;
  }
  return path;
}

export async function saveStudentProfile(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const course = String(formData.get("course") ?? "")
    .trim()
    .toUpperCase();
  const year = String(formData.get("year") ?? "").trim();
  const sectionCode = String(formData.get("sectionCode") ?? "")
    .trim()
    .toUpperCase();
  const idFormat = String(formData.get("idFormat") ?? "standard").trim();
  const studentNumberValue = String(formData.get("studentNumber") ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3,4}$/.test(course)) {
    return { error: "Enter a valid four-letter course code, such as BSIT." };
  }

  if (!/^[1-4]$/.test(year)) {
    return { error: "Select a year level from 1 to 4." };
  }

  if (!/^[A-Z]{1,3}$/.test(sectionCode)) {
    return { error: "Enter a section code using 1 to 3 letters." };
  }

  if (!studentNumberValue) {
    return { error: "Enter your student number." };
  }

  if (studentNumberValue.length > CUSTOM_ID_MAX_LENGTH) {
    return {
      error: "That student number looks too long. Check it and try again.",
    };
  }

  if (idFormat !== "custom") {
    const studentIdMatch = STANDARD_ID_PATTERN.exec(studentNumberValue);
    if (!studentIdMatch) {
      return { error: "Enter a valid student ID, such as 24BSIT-0345." };
    }

    if (studentIdMatch[2] !== course) {
      return { error: "The course must match the course in your student ID." };
    }
  }
  // Custom-issued IDs skip the pattern and course-match checks — they don't
  // necessarily encode the course, so they're accepted as entered,
  // normalized to uppercase like every other stored student number.

  const section = `${course} ${year}${sectionCode}`;

  try {
    await userRepository.updateProfile({
      id: userId,
      section,
      studentNumber: studentNumberValue,
    });
  } catch {
    return {
      error:
        "That student number may already be registered. Check it and try again.",
    };
  }

  // Requests snapshot the student's section at submission time. If the student
  // corrected a wrong profile, carry their still-pending requests over to the
  // corrected section so the registrar sees the right class. A failure here
  // must not undo the profile save, so log the raw error and continue.
  try {
    await requestRepository.reassignPendingRequestsSection(userId, section);
  } catch (error) {
    console.error(
      "[profile] Failed to move pending requests to the corrected section:",
      error,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/request");
  redirect(safeReturnTo(formData.get("returnTo")) ?? "/dashboard");
}
