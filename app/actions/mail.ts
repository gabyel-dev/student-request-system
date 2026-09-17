"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { mailer, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";
import { sectionBroadcastEmail } from "@/src/infrastructure/mail/templates";

export type MailActionState = {
  error: string | null;
  success: string | null;
};

const MAX_SUBJECT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 4000;
const ALL_SECTIONS = "__all__";

export async function sendSectionAnnouncement(
  _previousState: MailActionState,
  formData: FormData,
): Promise<MailActionState> {
  const userId = await getSessionTokenUserId();
  if (!userId)
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };

  const admin = await userRepository.findById(userId);
  if (!admin || !isAdminEmail(admin.email))
    return { error: "Admin access is required.", success: null };

  const rawSection = String(formData.get("section") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim().slice(0, MAX_SUBJECT_LENGTH);
  const message = String(formData.get("message") ?? "")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);

  if (!rawSection)
    return { error: "Choose a section to email.", success: null };
  if (!subject)
    return { error: "Add a subject for your email.", success: null };
  if (!message)
    return { error: "Write a message before sending.", success: null };

  const students = (await userRepository.findAll()).filter(
    (student) => !isAdminEmail(student.email),
  );

  const allSections = new Set(
    students.map((s) => s.section).filter((s): s is string => Boolean(s)),
  );
  const targetingAll = rawSection === ALL_SECTIONS;
  if (!targetingAll && !allSections.has(rawSection))
    return { error: "That section has no registered students.", success: null };

  // Only verified profiles (a section plus student number) receive emails.
  const recipients = students.filter((student) =>
    targetingAll
      ? Boolean(student.section && student.studentNumber)
      : student.section === rawSection &&
        Boolean(student.section && student.studentNumber),
  );
  if (recipients.length === 0)
    return {
      error: "No verified students match this section. Students must finish their profile first.",
      success: null,
    };

  const targetLabel = targetingAll
    ? `all verified students (${recipients.length})`
    : `section ${rawSection} (${recipients.length})`;

  if (!mailer.isConfigured())
    return {
      error:
        "SMTP is not configured yet. Ask the developers to add the SMTP_* environment variables.",
      success: null,
    };

  // Send one personalized email per student so every recipient is greeted by
  // their own name. All sends for the section run as a single batch.
  const results = await Promise.allSettled(
    recipients.map((student) => {
      const template = sectionBroadcastEmail({
        recipientName: student.fullName || "Student",
        section: targetingAll ? "All Sections" : rawSection,
        message,
        senderName: admin.fullName,
      });
      return mailer.send({
        to: student.email,
        subject,
        html: template.html,
        text: template.text,
      });
    }),
  );

  const failed = results.filter(
    (result) => result.status === "rejected",
  ).length;
  if (failed > 0) {
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Failed to send a section announcement:", result.reason);
      }
    }
    return {
      error:
        failed === recipients.length
          ? "The email could not be sent. Check your SMTP settings and try again."
          : `Sent ${recipients.length - failed} of ${recipients.length} emails. ${failed} failed to send.`,
      success: null,
    };
  }

  revalidatePath("/dashboard");
  return {
    error: null,
    success: `Announcement sent individually to ${targetLabel}. They will be notified by email.`,
  };
}