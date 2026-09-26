"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiCheckSquare, FiUsers, FiX } from "react-icons/fi";
import { completeQueueCycle } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest } from "@/src/domain/request";

// Per-section summary of the ACTIVE queue: which number is currently being
// served (highest assigned), how many requests are still waiting, and how many
// requests exist this cycle. Every section counts independently.
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

  for (const request of requests) {
    const stats = bySection.get(request.section ?? "Unknown") ?? {
      currentQueue: 0,
      waiting: 0,
      total: 0,
    };
    stats.total += 1;
    stats.currentQueue = Math.max(stats.currentQueue, request.queueNumber);
    if (request.status === "pending" || request.status === "processing") {
      stats.waiting += 1;
    }
    bySection.set(request.section ?? "Unknown", stats);
  }

  return [...bySection.entries()]
    .map(([section, stats]) => ({ section, ...stats }))
    .sort((a, b) => a.section.localeCompare(b.section));
}

/**
 * Live view of every section's independent queue, plus the admin's
 * "Complete Queue" action. Completing a cycle archives all active requests
 * (nothing is deleted) and lets every section restart at Queue 1.
 */
export function QueueCyclePanel({ requests }: { requests: StudentRequest[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { success: toastSuccess, error: toastError } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sections = buildSectionStats(requests);
  const hasActive = sections.length > 0;

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
        .catch(() => {
          toastError("The queue could not be reset. Try again.");
        });
    });
  }

  return (
    <section
      id="queue-cycle"
      className="dash-glass overflow-hidden rounded-tr-4xl rounded-bl-4xl scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[#e7efea] px-4 py-3.5 sm:px-6">
        <div>
          <h2 className="text-base font-bold tracking-[-.02em] text-[#123b32]">
            Active queues
          </h2>
          <p className="mt-0.5 text-xs text-[#5d6f66]">
            Each section numbers its own queue, starting again at 1 every cycle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending || !hasActive}
          className="inline-flex items-center gap-2 rounded-full bg-[#087a54] px-4 py-2 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(8,122,84,.3)] transition hover:bg-[#066044] disabled:cursor-not-allowed disabled:opacity-50">
          <FiCheckSquare aria-hidden="true" />
          {isPending ? "Completingâ€¦" : "Complete queue"}
        </button>
      </div>

      {hasActive ? (
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6">
          {sections.map(({ section, currentQueue, waiting, total }) => (
            <div
              key={section}
              className="rounded-tr-2xl rounded-bl-2xl border border-[#dcebe3] bg-[#f7fbf9] p-4">
              <span className="flex items-center gap-2">
                <FiUsers className="text-[#087a54]" aria-hidden="true" />
                <strong className="truncate text-sm font-bold text-[#14251d]">
                  {section}
                </strong>
              </span>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label="Current queue" value={currentQueue} accent />
                <Stat label="Waiting" value={waiting} />
                <Stat label="This cycle" value={total} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center sm:px-6">
          <p className="text-sm font-semibold text-[#14251d]">
            No active requests
          </p>
          <p className="mt-1 text-xs text-[#5d6f66]">
            New submissions will start this section&apos;s queue at Queue 1.
          </p>
        </div>
      )}

      {confirmOpen ? (
        <CompleteQueueDialog
          sectionCount={sections.length}
          recordCount={requests.length}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleComplete}
          isPending={isPending}
        />
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <span>
      <strong
        className={`block text-lg font-bold tabular-nums tracking-tight ${
          accent ? "text-[#087a54]" : "text-[#123b32]"
        }`}>
        {value}
      </strong>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#5d6f66]">
        {label}
      </span>
    </span>
  );
}

/**
 * Confirmation shown before completing the queue. It spells out exactly what
 * the reset does so the admin is never surprised:
 *  - current queue records are archived (kept, not deleted),
 *  - every section's active queue resets to 0,
 *  - the next request in a section starts again at Queue 1,
 *  - archived records stay accessible in the Archive below.
 */
function CompleteQueueDialog({
  sectionCount,
  recordCount,
  onCancel,
  onConfirm,
  isPending,
}: {
  sectionCount: number;
  recordCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const points = [
    `${recordCount} active request${recordCount === 1 ? "" : "s"} will be archived â€” nothing is deleted.`,
    `The active queue counter of every section resets to 0.`,
    `New requests will start again at Queue 1 for each section.`,
    `Archived records remain accessible, grouped by section and date.`,
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-queue-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-tr-3xl rounded-bl-3xl bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,.35)]"
        onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h3
            id="complete-queue-title"
            className="text-lg font-bold tracking-[-.02em] text-[#123b32]">
            Complete the queue cycle?
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-[#6f8579] transition hover:bg-black/5 hover:text-[#14251d]">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <ul className="mt-4 space-y-2.5">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 text-[13px] leading-5 text-[#41584c]">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#087a54]"
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-5 text-[#5d6f66]">
          {sectionCount} section{sectionCount === 1 ? "" : "s"} will restart at
          Queue 1. This affects all sections at once.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full border border-[#cfddd5] bg-white px-4 py-2 text-[12px] font-bold text-[#2c4036] transition hover:border-[#9ebbab]">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#087a54] px-4 py-2 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(8,122,84,.3)] transition hover:bg-[#066044] disabled:opacity-50">
            {isPending ? "Completingâ€¦" : "Complete & archive"}
          </button>
        </div>
      </div>
    </div>
  );
}