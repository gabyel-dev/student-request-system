"use client";

import { FiLoader } from "react-icons/fi";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";

const dot: Record<RequestStatus, string> = {
  pending: "bg-amber-500",
  processing: "bg-blue-500",
  completed: "bg-emerald-600",
  rejected: "bg-neutral-400",
};

export function StatusControl({
  request,
  isPending,
  updatingId,
  onChangeStatus,
}: {
  request: StudentRequest;
  isPending: boolean;
  updatingId: string | null;
  onChangeStatus: (id: string, status: RequestStatus) => void;
}) {
  const busy = isPending && updatingId === request.id;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${dot[request.status]}`}
        aria-hidden="true"
      />
      <select
        value={request.status}
        disabled={busy}
        onChange={(e) =>
          onChangeStatus(request.id, e.target.value as RequestStatus)
        }
        aria-label={`Update status for ${request.studentName}'s ${request.documentType} request`}
        className="rounded-full border border-[#DDE5E0] bg-white py-1 pl-2.5 pr-7 text-xs font-medium capitalize text-[#17211B] outline-none hover:border-[#0B6B4A]/40 focus:border-[#0B6B4A] disabled:opacity-60">
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>
      {busy ? (
        <FiLoader
          className="animate-spin text-xs text-[#62716A]"
          aria-label="Saving"
        />
      ) : null}
    </span>
  );
}
