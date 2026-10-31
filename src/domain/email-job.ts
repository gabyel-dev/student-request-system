export type EmailJobStatus = "queued" | "sending" | "completed" | "failed";

/** Live progress for an admin announcement, safe to send to the browser. */
export type EmailJob = {
  id: string;
  section: string;
  subject: string;
  total: number;
  sent: number;
  failed: number;
  status: EmailJobStatus;
  currentSection: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
