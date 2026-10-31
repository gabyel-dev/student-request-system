import type { EmailJob } from "@/src/domain/email-job";

/**
 * Progress for admin announcement batches.
 *
 * This is intentionally process-local: the mailer runs in the same Node
 * process that served the server action, so the admin dashboard can poll this
 * store while the tab stays open. Jobs disappear if the server restarts, which
 * is why the UI tells the admin to keep the tab open until sending finishes.
 */
const MAX_JOBS = 20;
const COMPLETED_TTL_MS = 60 * 60 * 1000;

type EmailJobGlobal = {
  __emailJobs?: Map<string, EmailJob>;
};

const globalForEmailJobs = globalThis as typeof globalThis & EmailJobGlobal;
const jobs =
  globalForEmailJobs.__emailJobs ?? new Map<string, EmailJob>();
globalForEmailJobs.__emailJobs = jobs;

function now() {
  return new Date().toISOString();
}

function prune() {
  const cutoff = Date.now() - COMPLETED_TTL_MS;

  for (const [id, job] of jobs) {
    if (
      (job.status === "completed" || job.status === "failed") &&
      job.completedAt &&
      new Date(job.completedAt).getTime() < cutoff
    ) {
      jobs.delete(id);
    }
  }

  if (jobs.size <= MAX_JOBS) return;

  const oldestFirst = [...jobs.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  for (const job of oldestFirst) {
    if (jobs.size <= MAX_JOBS) break;
    if (job.status !== "sending" && job.status !== "queued") {
      jobs.delete(job.id);
    }
  }
}

export const emailJobStore = {
  create(input: {
    section: string;
    subject: string;
    total: number;
  }): EmailJob {
    prune();
    const timestamp = now();
    const job: EmailJob = {
      id: crypto.randomUUID(),
      section: input.section,
      subject: input.subject,
      total: input.total,
      sent: 0,
      failed: 0,
      status: "queued",
      currentSection: null,
      error: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
    };
    jobs.set(job.id, job);
    return { ...job };
  },

  markSending(id: string, currentSection: string | null = null) {
    const job = jobs.get(id);
    if (!job) return;
    job.status = "sending";
    job.currentSection = currentSection;
    job.updatedAt = now();
  },

  setCurrentSection(id: string, section: string) {
    const job = jobs.get(id);
    if (!job) return;
    job.currentSection = section;
    job.updatedAt = now();
  },

  recordResult(id: string, success: boolean) {
    const job = jobs.get(id);
    if (!job) return;
    if (success) job.sent += 1;
    else job.failed += 1;
    job.updatedAt = now();
  },

  finish(id: string) {
    const job = jobs.get(id);
    if (!job) return;
    job.status = job.failed === job.total ? "failed" : "completed";
    job.currentSection = null;
    job.completedAt = now();
    job.updatedAt = now();
  },

  fail(id: string, message: string) {
    const job = jobs.get(id);
    if (!job) return;
    job.status = "failed";
    job.error = message;
    job.currentSection = null;
    job.completedAt = now();
    job.updatedAt = now();
  },

  list(): EmailJob[] {
    prune();
    return [...jobs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((job) => ({ ...job }));
  },
};
