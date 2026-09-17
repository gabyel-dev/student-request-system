"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiLayers,
  FiSend,
} from "react-icons/fi";
import { updateRequestStatus } from "@/app/actions/requests";
import { useToast } from "@/app/components/toaster";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";
import { useRequestFilters } from "../lib/use-request-filters";
import type { StatusFilter } from "../lib/request-utils";
import { DuckMascot } from "../student/duck-mascot";
import { RequestCardList, RequestTable } from "./requests-list";
import { SectionGroups } from "./section-groups";
import { StudentsPanel } from "./students-panel";
import { EmailPanel } from "./email-panel";
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

  const counts = filters.counts;
  const overview = [
    {
      label: "Total requests",
      value: counts.all,
      icon: FiLayers,
      tilt: "dash-tilt--left",
      filter: "all" as const,
    },
    {
      label: "Needs review",
      value: counts.pending,
      icon: FiClock,
      tilt: "",
      filter: "pending" as const,
    },
    {
      label: "Completed",
      value: counts.completed,
      icon: FiCheckCircle,
      tilt: "dash-tilt--right",
      filter: "completed" as const,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      <section className="dash-hero relative overflow-hidden rounded-tr-4xl rounded-bl-4xl shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        <img
          src="/bg.webp"
          alt=""
          aria-hidden="true"
          className="dash-hero__texture pointer-events-none"
        />
        <div className="dash-hero__shade pointer-events-none" />
        <div className="dash-hero__wave dash-hero__wave--back" />
        <div className="dash-hero__wave dash-hero__wave--front" />
        <div className="dash-hero__blob dash-hero__blob--one" />
        <div className="dash-hero__blob dash-hero__blob--two" />

        <DuckMascot />

        <div className="relative z-10 px-4 py-6 sm:px-9 sm:py-12 lg:pr-52 lg:pl-12 xl:pr-60">
          <div className="dash-glass z-20 rounded-tr-3xl rounded-bl-3xl  dash-skew relative max-w-lg px-5 py-6 sm:px-8 sm:py-9">
            <span className="absolute -top-3.5 left-8 rounded-full border border-white/70 bg-[#087a54] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_6px_14px_rgba(8,122,84,.35)]">
              Admin
            </span>
            <h1 className="text-[22px] font-bold leading-[1.12] tracking-[-0.045em] text-[#123b32] sm:text-[36px]">
              Hello, Admin.
              <span className="block font-medium text-[#4a7a6a]">
                What needs attention today?
              </span>
            </h1>
            <p className="mt-2 text-sm leading-5 text-[#52706a] sm:mt-3 sm:text-[15px] sm:leading-6">
              Review, process, and track student document requests — or send
              section-wide updates.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
              <a
                href="#requests"
                className="group inline-flex items-center gap-2 rounded-full bg-[#087a54] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(8,122,84,.35)] transition hover:bg-[#066044] sm:px-6 sm:py-3 sm:text-sm">
                <FiCheckSquare className="text-[14px] sm:text-[15px]" />
                Review queue
              </a>
              <a
                href="#email"
                className="inline-flex items-center gap-2 rounded-full border border-[#0d6951]/25 bg-white/50 px-5 py-2.5 text-[13px] font-bold text-[#24574a] backdrop-blur transition hover:border-[#0d6951]/40 hover:bg-white/80 sm:px-6 sm:py-3 sm:text-sm">
                <FiSend className="text-[14px]" />
                Email students
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-1 grid-cols-1 md:grid-cols-1 lg:grid-cols-3 w-full pb-1">
        {overview.map(({ label, value, icon: Icon, tilt, filter }, index) => {
          const isActive = filters.statusFilter === filter;
          return (
            <button
              key={label}
              type="button"
              onClick={() => selectStatus(filter)}
              aria-pressed={isActive}
              className={`dash-glass ${
                index === 0 ? "lg:rounded-tl-4xl" : ""
              } dash-tilt flex items-center gap-3 px-4 py-4 text-left transition sm:gap-4 sm:px-5 sm:py-5 ${tilt} hover:-translate-y-0.5 ${
                isActive
                  ? "ring-2 ring-[#087a54]/25"
                  : "focus-visible:ring-2 focus-visible:ring-[#087a54]/40"
              }`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#e3f5ee] to-[#cdeeda] text-[#087a54] sm:h-11 sm:w-11">
                <Icon className="text-lg sm:text-xl" />
              </span>
              <span>
                <strong className="block text-xl font-bold tabular-nums tracking-tight text-[#123b32] sm:text-2xl">
                  {value}
                </strong>
                <span className="text-[11px] font-semibold text-[#5d6f66] sm:text-xs">
                  {label}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <section
        data-entrance
        id="requests"
        className="dash-glass overflow-hidden rounded-tr-4xl rounded-bl-4xl scroll-mt-24 [animation:register-in_0.4s_cubic-bezier(.16,1,.3,1)]">
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

      <div className="border-t border-[#d9e6de]" />

      <EmailPanel students={students} requests={requests} />
    </div>
  );
}