"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiMail,
} from "react-icons/fi";
import type { EmailJob } from "@/src/domain/email-job";

const POLL_MS = 1000;

function isActive(job: EmailJob) {
  return job.status === "queued" || job.status === "sending";
}

function statusLabel(job: EmailJob) {
  if (job.status === "queued") return "Queued";
  if (job.status === "sending") return "Sending";
  if (job.status === "failed") return "Failed";
  return job.failed > 0 ? "Completed with errors" : "Completed";
}

function progressPercent(job: EmailJob) {
  if (job.total <= 0) return 0;
  return Math.min(100, Math.round(((job.sent + job.failed) / job.total) * 100));
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function EmailProgress() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [open, setOpen] = useState(false);
  const lastActiveJobRef = useRef<string | null>(null);

  const activeJob = useMemo(() => jobs.find(isActive) ?? null, [jobs]);
  const latestJob = jobs[0] ?? null;

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    async function load() {
      try {
        const response = await fetch("/api/admin/email-jobs", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = (await response.json()) as { jobs?: EmailJob[] };
          if (!stopped && Array.isArray(data.jobs)) {
            setJobs(data.jobs);

            const nextActive = data.jobs.find(isActive) ?? null;
            if (nextActive) {
              if (lastActiveJobRef.current !== nextActive.id) {
                lastActiveJobRef.current = nextActive.id;
                setOpen(true);
              }
            } else {
              lastActiveJobRef.current = null;
            }
          }
        }
      } catch {
        // The next poll retries; keep showing the last known progress.
      }

      if (!stopped) timer = window.setTimeout(load, POLL_MS);
    }

    void load();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (!latestJob) return null;

  const headline = activeJob ?? latestJob;
  const headlineActive = isActive(headline);
  const headlineFailed = headline.status === "failed";
  const processed = headline.sent + headline.failed;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-2rem))] sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Email sending progress"
          className="overflow-hidden rounded-2xl border border-[#DDE5E0] bg-white shadow-[0_18px_50px_-16px_rgba(10,53,39,0.45)]">
          <header className="flex items-start justify-between gap-3 bg-[#0A3527] px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                {headlineActive ? (
                  <FiLoader className="animate-spin" aria-hidden="true" />
                ) : headlineFailed ? (
                  <FiAlertCircle aria-hidden="true" />
                ) : (
                  <FiCheckCircle aria-hidden="true" />
                )}
              </span>
              <div>
                <p className="text-[13px] font-semibold">Email progress</p>
                <p className="text-[11px] text-white/60">
                  {headlineActive
                    ? "Sending in section batches"
                    : headlineFailed
                      ? "Sending stopped"
                      : "Announcement finished"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Collapse email progress"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white">
              <FiChevronDown aria-hidden="true" />
            </button>
          </header>

          <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-3">
            <ul className="space-y-2">
              {jobs.map((job) => {
                const jobActive = isActive(job);
                const jobFailed = job.status === "failed";
                const percent = progressPercent(job);
                return (
                  <li
                    key={job.id}
                    className="rounded-xl border border-[#EEF2EF] bg-[#FAFBFA] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#17211B]">
                          {job.subject}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-[#62716A]">
                          {job.section} · {formatTime(job.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          jobActive
                            ? "bg-[#0B6B4A]/10 text-[#0B6B4A]"
                            : jobFailed
                              ? "bg-red-50 text-red-700"
                              : "bg-[#EEF2EF] text-[#3E4B44]"
                        }`}>
                        {statusLabel(job)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-end justify-between gap-3">
                      <p className="font-mono text-[13px] font-semibold tabular-nums text-[#17211B]">
                        {job.sent}
                        <span className="text-[#8A9A92]"> / {job.total}</span>{" "}
                        <span className="font-sans text-[11px] font-medium text-[#62716A]">
                          sent
                        </span>
                      </p>
                      {job.failed > 0 ? (
                        <p className="text-[11px] font-semibold text-red-700">
                          {job.failed} failed
                        </p>
                      ) : null}
                    </div>

                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6ECE8]"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={job.total}
                      aria-valuenow={job.sent + job.failed}
                      aria-label={`${job.sent} of ${job.total} emails sent`}>
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          jobFailed ? "bg-red-600" : "bg-[#0B6B4A]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-[11px] text-[#62716A]">
                      {jobActive
                        ? job.currentSection
                          ? `Sending ${job.currentSection}…`
                          : "Starting…"
                        : job.error
                          ? job.error
                          : `${processed} of ${job.total} processed`}
                    </p>
                  </li>
                );
              })}
            </ul>

            {jobs.some(isActive) ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                Don&apos;t close this tab while sending email. Progress updates
                every second.
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-label="Open email sending progress"
          className="flex w-full items-center gap-3 rounded-2xl bg-[#0A3527] px-4 py-3 text-left text-white shadow-[0_18px_50px_-16px_rgba(10,53,39,0.45)] transition hover:bg-[#0d4030]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">
            {headlineActive ? (
              <FiLoader className="animate-spin" aria-hidden="true" />
            ) : headlineFailed ? (
              <FiAlertCircle aria-hidden="true" />
            ) : (
              <FiMail aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">
              {headlineActive
                ? "Sending email…"
                : headlineFailed
                  ? "Email sending failed"
                  : "Email sent"}
            </span>
            <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-white/60">
              {headline.sent} / {headline.total} sent
              {headline.failed > 0 ? ` · ${headline.failed} failed` : ""}
            </span>
          </span>
          <FiChevronUp
            className="shrink-0 text-white/60"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
