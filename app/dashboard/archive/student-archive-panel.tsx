"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiArchive,
  FiFileText,
  FiInbox,
  FiRotateCcw,
} from "react-icons/fi";
import { restoreRequest } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest } from "@/src/domain/request";
import { formatDateTime } from "../lib/format";
import { StatusPill } from "../student/status-pill";

export function StudentArchivePanel({
  archived,
}: {
  archived: StudentRequest[];
}) {
  const [requests, setRequests] = useState(archived);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  async function restore(request: StudentRequest) {
    setRestoringId(request.id);
    try {
      const result = await restoreRequest(request.id);
      if (result.error) {
        toastError(result.error);
        return;
      }
      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );
      toastSuccess(result.success ?? "Request restored to your dashboard.");
      router.refresh();
    } catch {
      toastError("The request could not be restored. Try again.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="sd-panel mt-8" aria-labelledby="archive-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-sunken px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
            <FiArchive size={18} aria-hidden="true" />
          </span>
          <div>
            <h2
              id="archive-title"
              className="text-lg font-bold tracking-[-0.025em] text-ink">
              Filed away
            </h2>

          </div>
        </div>

      </div>

      {requests.length === 0 ? (
        <EmptyArchive />
      ) : (
        <ul>
          {requests.map((request) => (
            <ArchiveRow
              key={request.id}
              request={request}
              restoring={restoringId === request.id}
              disabled={restoringId !== null}
              onRestore={() => void restore(request)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ArchiveRow({
  request,
  restoring,
  disabled,
  onRestore,
}: {
  request: StudentRequest;
  restoring: boolean;
  disabled: boolean;
  onRestore: () => void;
}) {
  return (
    <li className="border-b border-rule px-5 py-4 last:border-b-0 sm:px-7">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <FiFileText size={19} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-sm font-semibold text-ink">
              {request.documentType}
            </strong>
            <StatusPill status={request.status} />
          </div>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">
            Queue #{String(request.queueNumber).padStart(3, "0")}
            {request.section ? ` · ${request.section}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Archived{" "}
            {formatDateTime(request.studentArchivedAt ?? request.updatedAt)}
          </p>
          {request.notes ? (
            <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-[12px] leading-5 text-muted">
              {request.notes}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onRestore}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-hairline bg-surface px-3 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent disabled:opacity-50">
          <FiRotateCcw size={14} aria-hidden="true" className="shrink-0" />
          {restoring ? "Restoring…" : "Restore"}
        </button>
      </div>
    </li>
  );
}

function EmptyArchive() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-hairline bg-sunken text-muted">
        <FiInbox size={24} aria-hidden="true" />
      </span>
      <p className="mt-5 text-base font-bold tracking-[-0.015em] text-ink">
        Your archive is empty
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted">
        Finished requests can be archived from your dashboard. They will stay
        here until you restore them.
      </p>
    </div>
  );
}
