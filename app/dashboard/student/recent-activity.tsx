"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiEdit, FiFileText, FiTrash } from "react-icons/fi";
import { deleteRequest } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import { getServiceByTitle } from "@/src/domain/services";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";

const statusMeta: Record<
  RequestStatus,
  { label: string; width: number; bar: string; text: string }
> = {
  pending: {
    label: "Pending review",
    width: 25,
    bar: "bg-gradient-to-r from-[#c9922b] to-[#b07b17]",
    text: "text-[#8a5e10]",
  },
  processing: {
    label: "Being processed",
    width: 65,
    bar: "bg-gradient-to-r from-[#4fa3e3] to-[#1f6fb2]",
    text: "text-[#16578f]",
  },
  completed: {
    label: "Completed",
    width: 100,
    bar: "bg-gradient-to-r from-[#28b48a] to-[#087a54]",
    text: "text-[#0a6a49]",
  },
  rejected: {
    label: "Rejected",
    width: 100,
    bar: "bg-gradient-to-r from-[#c96a63] to-[#b0423c]",
    text: "text-[#8f3029]",
  },
};

export function RecentActivity({ requests }: { requests: StudentRequest[] }) {
  const active = requests.filter(
    (request) => request.status !== "completed",
  ).length;
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete(requestId: string, documentType: string) {
    if (
      !window.confirm(
        `Delete your ${documentType} request? This cannot be undone.`,
      )
    )
      return;
    startTransition(() => {
      void deleteRequest(requestId)
        .then((result) => {
          if (result.error) {
            toastError(result.error);
            return;
          }
          toastSuccess(result.success ?? "Request deleted.");
          router.refresh();
        })
        .catch(() => {
          toastError("The request could not be deleted. Try again.");
        });
    });
  }

  return (
    <section
      id="requests"
      className="dash-glass scroll-mt-24 px-4 py-5 sm:px-8 sm:py-7 relative z-4 lg:rounded-tr-4xl lg:rounded-br-4xl ">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-.03em] text-[#123b32]">
            Recent requests
          </h2>
        </div>
      </div>

      {requests.length ? (
        <div className="mt-3 border-t border-[#dcebe3] sm:mt-4">
          {requests.slice(0, 5).map((request) => {
            const meta = statusMeta[request.status];
            const isActive =
              request.status === "pending" || request.status === "processing";
            return (
              <div
                className="flex flex-col gap-3 border-b border-[#dcebe3] py-3.5 last:border-b-0 lg:flex-row lg:items-center lg:gap-6 lg:py-4"
                key={request.id}>
                <div className="flex min-w-0 items-center gap-2.5 lg:w-60 lg:shrink-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e9f6f0] text-[#087a54]">
                    <FiFileText className="text-[15px]" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm text-[#14251d]">
                      {request.documentType}
                    </strong>
                    <span className="text-[11px] text-[#5d6f66]">
                      Queue #{request.queueNumber}
                    </span>
                  </span>
                </div>

                <div className="min-w-0 flex-1 order-2 lg:order-none">
                  <div className="mb-1.5 flex w-full items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${meta.text}`}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-[#5d6f66]">
                      {request.status === "rejected"
                        ? "Closed"
                        : `${meta.width}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e3efe9]">
                    <div
                      className={`dash-progress h-full rounded-full ${meta.bar} ${
                        isActive ? "dash-progress--active" : ""
                      }`}
                      style={{ width: `${meta.width}%` }}
                    />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end order-1 lg:order-last lg:self-center">
                  {request.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const service = getServiceByTitle(
                            request.documentType,
                          );
                          router.push(
                            service
                              ? `/request/${service.slug}?edit=${request.id}`
                              : `/request/${encodeURIComponent(request.documentType)}?edit=${request.id}`,
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#bfd9cc] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#087a54] transition-colors hover:border-[#087a54] hover:bg-[#f7fbf9] disabled:opacity-50"
                        aria-label={`Edit ${request.documentType} request`}>
                        <FiEdit className="text-[11px]" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleDelete(request.id, request.documentType)
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-[#ecdcdb] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#b0423c] transition-colors hover:border-[#b0423c] hover:bg-[#fdf6f6] disabled:opacity-50"
                        aria-label={`Delete ${request.documentType} request`}>
                        <FiTrash className="text-[11px]" />
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[#c9ded2] bg-white/40 px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f6f0] text-[#087a54]">
            <FiFileText className="text-xl" />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#14251d]">
            No requests yet
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-[#5d6f66]">
            Start one from the start a request button — it will show up here
            with its queue number and live progress.
          </p>
        </div>
      )}
    </section>
  );
}
