"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import { completeQueueCycle } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest } from "@/src/domain/request";

type SectionStats = {
  section: string;
  currentQueue: number;
  waiting: number;
  total: number;
};

function buildSectionStats(requests: StudentRequest[]): SectionStats[] {
  const bySection = new Map<
    string,
    { currentQueue: number; waiting: number; total: number }
  >();
  for (const r of requests) {
    const key = r.section ?? "Unknown";
    const s = bySection.get(key) ?? { currentQueue: 0, waiting: 0, total: 0 };
    s.total += 1;
    s.currentQueue = Math.max(s.currentQueue, r.queueNumber);
    if (r.status === "pending" || r.status === "processing") s.waiting += 1;
    bySection.set(key, s);
  }
  return (
    [...bySection.entries()]
      .map(([section, s]) => ({ section, ...s }))
      // Most waiting first — the sections that need attention lead.
      .sort(
        (a, b) => b.waiting - a.waiting || a.section.localeCompare(b.section),
      )
  );
}

/** Only finished requests leave the active queue on cycle completion. */
function isArchivable(status: StudentRequest["status"]) {
  return status === "completed" || status === "rejected";
}

export function QueueCyclePanel({ requests }: { requests: StudentRequest[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { success: toastSuccess, error: toastError } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sections = buildSectionStats(requests);
  const hasActive = sections.length > 0;
  const archivableCount = requests.filter((r) => isArchivable(r.status)).length;
  const carriedCount = requests.length - archivableCount;
  const canComplete = archivableCount > 0;
  const totalWaiting = sections.reduce((n, s) => n + s.waiting, 0);
  const maxWaiting = Math.max(1, ...sections.map((s) => s.waiting));

  function handleComplete() {
    setConfirmOpen(false);
    startTransition(() => {
      void completeQueueCycle()
        .then((result) => {
          if (result.error) {
            toastError(result.error);
            return;
          }
          toastSuccess(result.success ?? "Queue cycle completed.");
          router.refresh();
        })
        .catch(() => toastError("The queue could not be reset. Try again."));
    });
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#0A3527] p-6 shadow-[0_16px_40px_-20px_rgba(10,53,39,0.5)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
            Active queues
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-white/50">
            Each section numbers its own queue independently.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending || !canComplete}
          title={
            canComplete
              ? undefined
              : "Only completed or rejected requests can be archived"
          }
          className="shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/90 transition hover:border-white/40 hover:bg-white/10 disabled:opacity-40">
          {isPending ? "Completing…" : "Complete cycle"}
        </button>
      </div>

      {hasActive ? (
        <>
          <div className="mt-6 flex items-end gap-3">
            <p className="font-mono text-[44px] font-semibold tabular-nums leading-none tracking-tight text-[#8FD8AE]">
              {totalWaiting}
            </p>
            <p className="pb-1 text-[13px] leading-5 text-white/50">
              {totalWaiting === 1 ? "request" : "requests"} waiting
              <br />
              across {sections.length}{" "}
              {sections.length === 1 ? "section" : "sections"}
            </p>
          </div>

          <ul className="mt-6 space-y-2">
            {sections.map(({ section, waiting, total }) => {
              const idle = waiting === 0;
              return (
                <li
                  key={section}
                  className={`rounded-xl px-4 py-3 transition ${
                    idle ? "opacity-45" : "bg-white/[0.05]"
                  }`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="min-w-0 truncate text-sm font-semibold text-white">
                      {section}
                    </p>
                    <p className="shrink-0 font-mono text-lg font-semibold tabular-nums text-[#8FD8AE]">
                      {waiting}
                      <span className="ml-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                        waiting
                      </span>
                    </p>
                  </div>
                  <div
                    className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10"
                    role="img"
                    aria-label={`${waiting} of ${maxWaiting} waiting in ${section}`}>
                    <div
                      className="h-full rounded-full bg-[#8FD8AE]"
                      style={{ width: `${(waiting / maxWaiting) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] tabular-nums text-white/35">
                    {total} this cycle
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-white">No active requests</p>
          <p className="mt-1 text-xs text-white/50">
            New submissions will start at Queue 1.
          </p>
        </div>
      )}

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-queue-title"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3
                id="complete-queue-title"
                className="text-[17px] font-semibold tracking-tight text-[#17211B]">
                Complete the queue cycle?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                aria-label="Close dialog"
                className="grid h-8 w-8 place-items-center rounded-lg text-[#62716A] hover:bg-black/5">
                <FiX aria-hidden="true" />
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-[13px] leading-5 text-[#3E4B44]">
              <li>
                · {archivableCount} completed/rejected request(s) will be
                archived. Nothing is deleted.
              </li>
              {carriedCount > 0 ? (
                <li>
                  · {carriedCount} pending/processing request(s) stay active and
                  keep their queue numbers.
                </li>
              ) : null}
              <li>· Archived records stay accessible in the Archive.</li>
            </ul>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-full border border-[#DDE5E0] px-4 py-2 text-[13px] font-semibold">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isPending}
                className="rounded-full bg-[#0B6B4A] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#095a3e] disabled:opacity-50">
                {isPending ? "Completing…" : "Complete & archive"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
