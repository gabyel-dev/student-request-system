"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { FiArrowRight } from "react-icons/fi";
import { updateRequestStatus } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";
import { useRequestFilters } from "../lib/use-request-filters";
import { useRealtimeRequests } from "../lib/use-realtime-requests";

import type { StatusFilter } from "../lib/request-utils";
import { RequestCardList, RequestTable } from "./requests-list";
import { SectionGroups } from "./section-groups";
import { EmailPanel } from "./email-panel";
import { SummaryTabs } from "./summary-tabs";
import { Toolbar } from "./toolbar";
import { QueueCyclePanel } from "./queue-cycle-panel";
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const resolveUser = useMemo(() => {
    const byId = new Map(
      students.map((s) => [s.id, { fullName: s.fullName, email: s.email }]),
    );
    return (userId: string) => byId.get(userId);
  }, [students]);

  const { requests, isLive } = useRealtimeRequests({
    initialRequests,
    filter: undefined,
    resolveUser,
  });

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
        .catch(() => toastError("The request could not be updated. Try again."))
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

  const counts = filters.counts;
  const stats: {
    label: string;
    value: number;
    filter?: StatusFilter;
    href?: string;
  }[] = [
    { label: "Total requests", value: counts.all, filter: "all" },
    { label: "Needs review", value: counts.pending, filter: "pending" },
    { label: "Completed", value: counts.completed, filter: "completed" },
    {
      label: "Students",
      value: students.length,
      href: "/dashboard/admin/students",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#62716A]">
            Administration
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-[#17211B]">
            Requests
          </h1>
          <p className="mt-1 text-sm text-[#62716A]">
            Review, process, and track student document requests.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="#requests"
            className="inline-flex items-center rounded-full bg-[#0B6B4A] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#095a3e]">
            Review queue
          </a>
          <a
            href="#email"
            className="inline-flex items-center rounded-full border border-[#DDE5E0] bg-white px-4 py-2 text-[13px] font-semibold text-[#17211B] transition hover:border-[#0B6B4A]/40">
            Email students
          </a>
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <QueueCyclePanel requests={requests} />
        </div>
        <div className="grid grid-cols-2 content-stretch gap-3 lg:col-span-2">
          {stats.map(({ label, value, filter, href }) => {
            const isActive = filter && filters.statusFilter === filter;
            const className = `h-full w-full rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(18,28,22,0.06)] transition ${
              isActive
                ? "border-[#0B6B4A]/50"
                : "border-[#E6ECE8] hover:border-[#0B6B4A]/30"
            }`;
            const inner = (
              <>
                <p className="text-[13px] text-[#62716A]">{label}</p>
                <p className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight text-[#17211B]">
                  {value}
                </p>
              </>
            );
            return (
              <div key={label}>
                {href ? (
                  <Link
                    href={href}
                    className={`${className} flex items-center justify-between`}>
                    <span>{inner}</span>
                    <FiArrowRight
                      className="text-[#0B6B4A]"
                      aria-hidden="true"
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-pressed={Boolean(isActive)}
                    onClick={() => filter && selectStatus(filter)}
                    className={className}>
                    {inner}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="requests"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#E6ECE8] bg-white shadow-[0_1px_2px_rgba(18,28,22,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[#EEF2EF] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <SummaryTabs
              counts={filters.counts}
              active={filters.statusFilter}
              onSelect={selectStatus}
            />
          </div>
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
              <RequestTable
                requests={filters.sortedRequests}
                context={requestContext}
              />
              <div className="md:hidden">
                <RequestCardList
                  requests={filters.sortedRequests}
                  context={requestContext}
                />
              </div>
            </>
          ) : (
            <SectionGroups
              groups={filters.groupedBySection}
              context={requestContext}
            />
          )
        ) : (
          <div className="px-4 py-16 text-center sm:px-6">
            <p className="text-sm font-semibold text-[#17211B]">
              {requests.length
                ? "No records match this view"
                : "No requests yet"}
            </p>
            <p className="mt-1 text-[13px] text-[#62716A]">
              {requests.length
                ? "Change the status filter or clear the search."
                : "New student requests will appear here."}
            </p>
          </div>
        )}
      </section>

      <EmailPanel students={students} requests={requests} />
    </div>
  );
}
