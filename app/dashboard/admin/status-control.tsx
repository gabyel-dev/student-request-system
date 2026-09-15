"use client";

import { FiActivity } from "react-icons/fi";
import { statusTone } from "../lib/request-utils";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";

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
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className={`h-2 w-2 ${statusTone[request.status]}`} />
        <select
          className="border-b border-[#cfddd5] bg-transparent py-1 pr-6 text-xs font-semibold capitalize text-[#2c4036] outline-none transition-colors focus:border-[#087a54]"
          value={request.status}
          onChange={(event) =>
            onChangeStatus(request.id, event.target.value as RequestStatus)
          }
          disabled={isPending && updatingId === request.id}
          aria-label={`Update status for ${request.studentName}'s ${request.documentType} request`}>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </span>
      {updatingId === request.id ? (
        <FiActivity
          className="animate-spin text-xs text-[#5d6f66]"
          aria-label="Saving"
          aria-live="polite"
        />
      ) : null}
    </div>
  );
}