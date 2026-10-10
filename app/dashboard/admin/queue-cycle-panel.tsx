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
  return [...bySection.entries()]
    .map(([section, s]) => ({ section, ...s }))
    .sort((a, b) => a.section.localeCompare(b.section));
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
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6ECE8] bg-white shadow-[0_1px_2px_rgba(18,28,22,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#EEF2EF] px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#17211B]">
            Active queues
          </h2>
          <p className="mt-0.5 text-xs text-[#62716A]">
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
          className="shrink-0 rounded-full border border-[#DDE5E0] px-3.5 py-1.5 text-xs font-semibold text-[#17211B] transition hover:border-[#0B6B4A]/40 disabled:opacity-50">
          {isPending ? "Completing…" : "Complete cycle"}
        </button>
      </div>

      {hasActive ? (
        <ul className="divide-y divide-[#EEF2EF] px-4 sm:px-5">
          {sections.map(({ section, currentQueue, waiting, total }) => (
            <li
              key={section}
              className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#17211B]">
                  {section}
                </p>
                <p className="text-xs text-[#62716A]">
                  {waiting} waiting · {total} this cycle
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#F1F5F2] px-2.5 py-1 font-mono text-xs tabular-nums text-[#17211B]">
                #{String(currentQueue).padStart(3, "0")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-8 text-center sm:px-6">
          <p className="text-sm font-medium text-[#17211B]">
            No active requests
          </p>
          <p className="mt-1 text-xs text-[#62716A]">
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
