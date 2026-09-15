"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateRequestStatus } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";
import { useRequestFilters } from "../lib/use-request-filters";
import type { StatusFilter } from "../lib/request-utils";
import { RequestCardList, RequestTable } from "./requests-list";
import { SectionGroups } from "./section-groups";
import { StudentsPanel } from "./students-panel";
import { SummaryTabs } from "./summary-tabs";
import { Toolbar } from "./toolbar";
import type { RequestListContext } from "./types";

export function AdminDashboard({
  requests: initialRequests,
  students,
}: {
  requests: StudentRequest[];
  students: User[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const requests = initialRequests;
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const filters = useRequestFilters(requests, students);

  const requestContext: RequestListContext = {
    emailMaps: filters.emailMaps,
    isPending,
    updatingId,
    expandedId: filters.expandedId,
    onToggleRequest: filters.setExpandedId,
    onChangeStatus: changeStatus,
  };

  function selectStatus(status: StatusFilter) {
    filters.setStatusFilter(status);
  }

  function refresh() {
    router.refresh();
  }

  function runStatusUpdate(
    id: string,
    status: RequestStatus,
    message: string,
    previousStatus?: RequestStatus,
  ) {
    setUpdatingId(id);
    startTransition(() => {
      void updateRequestStatus(id, status)
        .then((result) => {
          if (result.error) {
            toastError(result.error);
            return;
          }
          if (previousStatus) {
            toastSuccess(result.success ?? message, {
              label: "Undo",
              onClick: () => undoChange(id, previousStatus),
            });
          } else {
            toastSuccess(result.success ?? message);
          }
          router.refresh();
        })
        .catch(() => {
          toastError("The request could not be updated. Try again.");
        })
        .finally(() => setUpdatingId(null));
    });
  }

  function changeStatus(id: string, status: RequestStatus) {
    const request = requests.find((item) => item.id === id);
    if (!request || request.status === status) return;
    if (
      status === "rejected" &&
      !window.confirm(
        "Reject this request? The student will need to submit a new request if they still need the document.",
      )
    )
      return;
    runStatusUpdate(id, status, "Record status updated.", request.status);
  }

  function undoChange(id: string, from: RequestStatus) {
    runStatusUpdate(id, from, `Reverted to ${from}.`);
  }

  return (
    <div className="space-y-10">
      <section className="relative flex min-h-24 items-end justify-between border-b border-[#d9e6de] pb-4 sm:min-h-28 sm:items-center sm:pb-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#087a54]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-[1.04] tracking-tighter text-[#14251d] sm:text-3xl">
            Request management
          </h1>
          <p className="mt-1 text-xs text-[#5d6f66]">
            Review, process, and track student document requests.
          </p>
        </div>
        <span className="hidden border border-[#d3e1d9] bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[.12em] text-[#087a54] sm:block">
          Admin
        </span>
      </section>

      <section
        data-entrance
        id="requests"
        className="[animation:register-in_0.4s_cubic-bezier(.16,1,.3,1)] border border-[#d3e1d9] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[#e7efea] px-4 py-3.5 sm:px-6">
          <SummaryTabs
            counts={filters.counts}
            active={filters.statusFilter}
            onSelect={selectStatus}
          />
          <Toolbar
            viewMode={filters.viewMode}
            onViewMode={filters.setViewMode}
            search={filters.search}
            onSearch={filters.setSearch}
            sortBy={filters.sortBy}
            onSort={filters.setSortBy}
            onRefresh={refresh}
          />
        </div>

        {filters.sortedRequests.length ? (
          filters.viewMode === "flat" ? (
            <>
              <RequestTable requests={filters.sortedRequests} context={requestContext} />
              <div className="md:hidden">
                <RequestCardList requests={filters.sortedRequests} context={requestContext} />
              </div>
            </>
          ) : (
            <SectionGroups groups={filters.groupedBySection} context={requestContext} />
          )
        ) : (
          <div className="px-4 py-16 text-center sm:px-6">
            <p className="text-sm font-semibold text-[#14251d]">
              {requests.length
                ? "No records match this view"
                : "No requests yet"}
            </p>
            <p className="mt-1 text-xs text-[#5d6f66]">
              {requests.length
                ? "Change the status filter or clear the search."
                : "New student requests will appear here."}
            </p>
          </div>
        )}
      </section>

      <StudentsPanel students={students} />
    </div>
  );
}