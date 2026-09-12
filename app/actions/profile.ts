"use server";

import { redirect } from "next/navigation";
import { userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";

export type ProfileFormState = {
  error: string | null;
};

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
  const studentNumberValue = String(formData.get("studentNumber") ?? "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{4}$/.test(course)) {
    return { error: "Enter a valid four-letter course code, such as BSIT." };
  }

  if (!/^[1-4]$/.test(year)) {
    return { error: "Select a year level from 1 to 4." };
  }

  if (!/^[A-Z]{1,3}$/.test(sectionCode)) {
    return { error: "Enter a section code using 1 to 3 letters." };
  }

  const studentIdMatch = /^(\d{2})([A-Z]{4})-(\d{4})$/.exec(studentNumberValue);
  if (!studentIdMatch) {
    return { error: "Enter a valid student ID, such as 24BSIT-0345." };
  }

  if (studentIdMatch[2] !== course) {
    return { error: "The course must match the course in your student ID." };
  }

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

  redirect("/dashboard");
}
