"use server";

import { after } from "next/server";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { mailer, userRepository } from "@/src/server/container";
import { emailJobStore } from "@/src/server/email-job-store";
import { getSessionTokenUserId } from "@/src/server/session";
import { sectionBroadcastEmail } from "@/src/infrastructure/mail/templates";

export type MailActionState = {
  error: string | null;
  success: string | null;
};

const MAX_SUBJECT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 4000;
const ALL_SECTIONS = "__all__";
const BATCH_SIZE = 10;

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

  // Group by section so a broadcast to everyone becomes one sequential batch
  // per section instead of hundreds of simultaneous SMTP connections. Each
  // section is still personalized, and each batch is small enough for Gmail's
  // sending limits while keeping the overall run fast.
  const bySection = new Map<string, typeof recipients>();
  for (const student of recipients) {
    const key = student.section ?? "Unknown section";
    const group = bySection.get(key) ?? [];
    group.push(student);
    bySection.set(key, group);
  }

  const job = emailJobStore.create({
    section: targetingAll ? "All sections" : rawSection,
    subject,
    total: recipients.length,
  });

  // Let the admin's request finish first. The mailer keeps working in the
  // background, so the form does not hang while a large section is sent.
  after(async () => {
    try {
      emailJobStore.markSending(job.id, bySection.keys().next().value ?? null);

      for (const [section, group] of bySection) {
        emailJobStore.setCurrentSection(job.id, section);

        for (let index = 0; index < group.length; index += BATCH_SIZE) {
          const batch = group.slice(index, index + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(async (student) => {
              try {
                const template = sectionBroadcastEmail({
                  recipientName: student.fullName || "Student",
                  section: targetingAll ? section : rawSection,
                  message,
                  senderName: admin.fullName,
                });
                await mailer.send({
                  to: student.email,
                  subject,
                  html: template.html,
                  text: template.text,
                });
                emailJobStore.recordResult(job.id, true);
              } catch (error) {
                emailJobStore.recordResult(job.id, false);
                throw error;
              }
            }),
          );

          for (const result of results) {
            if (result.status === "rejected") {
              console.error(
                `Failed to send an announcement to section ${section}:`,
                result.reason,
              );
            }
          }
        }
      }

      emailJobStore.finish(job.id);
    } catch (error) {
      emailJobStore.fail(
        job.id,
        error instanceof Error
          ? error.message
          : "The announcement could not be sent.",
      );
      console.error("Section announcement batch failed:", error);
    }
  });

  return {
    error: null,
    success: `Announcement queued for ${targetLabel}. Don't close the tab while sending — progress is in the bottom-right corner.`,
  };
}